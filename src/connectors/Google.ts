/*
 * Copyright (c) 2018 Rain Agency <contact@rain.agency>
 * Author: Rain Agency <contact@rain.agency>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import * as _Promise from "bluebird";
import { auth, JWT } from "google-auth-library";
import { google, sheets_v4 } from "googleapis";
import * as _ from "lodash";
import { IVoxaSheet } from "../VoxaSheet";
import { findSheetType, rowFormatted } from "./utils";

const sheets = google.sheets("v4");
const readSpreadsheet: any = _Promise.promisify(sheets.spreadsheets.get, { context: sheets });
const readSheetTab: any = _Promise.promisify(sheets.spreadsheets.values.get, { context: sheets });

function initVoxaSheet(
  spreadsheetsId: string[],
  spreadsheetResp: sheets_v4.Resource$Spreadsheets$Sheets[]
): IVoxaSheet[] {
  return _.chain(spreadsheetResp)
    .map((spreadsheet, index: number) => {
      const spreadsheetTitle = _.get(spreadsheet, "data.properties.title");
      const spreadsheetId = spreadsheetsId[index];
      const sheetNames = _.chain(spreadsheet)
        .get("data.sheets", [])
        .map("properties.title")
        .value();
      return sheetNames.map((sheetTitle: string) => {
        const voxaSheet: IVoxaSheet = { spreadsheetId, spreadsheetTitle, sheetTitle, type: "none" };
        return voxaSheet;
      });
    })
    .flatten()
    .map(findSheetType)
    .compact()
    .value();
}

async function spreadsheetToVoxaSheet(
  client: JWT,
  spreadsheetsId: string[],
  spreadsheetResp: sheets_v4.Resource$Spreadsheets$Sheets[] | IVoxaSheet[]
): Promise<IVoxaSheet[]> {
  spreadsheetResp = initVoxaSheet(
    spreadsheetsId,
    spreadsheetResp as sheets_v4.Resource$Spreadsheets$Sheets[]
  );

  let sheetPromises = spreadsheetResp.map((sheet: IVoxaSheet) =>
    readSheetTab({
      auth: client,
      spreadsheetId: sheet.spreadsheetId,
      range: `${sheet.sheetTitle}!A1:ZZZ`
    })
  );

  try {
    sheetPromises = await _Promise.all(sheetPromises);
  } catch (e) {
    throw new Error(`Unable to get spreadsheet ${e}`);
  }

  return spreadsheetResp.map((sheet: IVoxaSheet, index: number) => {
    const data = _.chain(sheetPromises[index])
      .get("data.values", [])
      .reduce(rowFormatted, [])
      .drop()
      .value();

    // Apply processor
    sheet.data = data;
    return sheet;
  });
}

export async function buildFromGoogleSheets(options: any, authKeys: {}): Promise<IVoxaSheet[]> {
  const spreadsheetsId = _.chain(options)
    .get("spreadsheets")
    .map(getGoogleSpreadsheetId)
    .compact()
    .value() as string[];

  let spreadsheetResp = [] as any[];

  if (_.isEmpty(spreadsheetsId) || _.isEmpty(authKeys)) {
    return [];
  }

  const client = auth.fromJSON(authKeys) as JWT;
  client.scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
  try {
    spreadsheetResp = await _Promise.all(
      spreadsheetsId.map((spreadsheetId: string) =>
        readSpreadsheet({ auth: client, spreadsheetId })
      )
    );
    // tslint:disable-next-line: no-empty
  } catch (e) {
    throw new Error(`Unable to read spreadsheets. Make sure user has access. ${e}`);
  }

  return spreadsheetToVoxaSheet(client, spreadsheetsId, spreadsheetResp);
}

function getGoogleSpreadsheetId(sheet: string): string | undefined {
  const matched = sheet.match(/docs\.google\.com\/spreadsheets\/d\/(.*)\/.*/);
  return sheet.includes("docs.google.com/spreadsheets") && matched && _.isString(matched[1])
    ? matched[1]
    : undefined;
}
