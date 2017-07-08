'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));

const ERROR_TYPE = {
  'MISSING_SAMPLE_UTTERANCES': 'MISSING_SAMPLE_UTTERANCES',
  'MISSING_INTENT_SCHEMA': 'MISSING_INTENT_SCHEMA',
  'MISSING_BUILTIN_INTENT': 'MISSING_BUILTIN_INTENT',
  'REQUIRED_INTENT': 'REQUIRED_INTENT',
  'MINIMUM_UTERANCES_ON_INTENT': 'MINIMUM_UTERANCES_ON_INTENT',
  'UTTERANCE_HAS_INVALID_CHARACTERS': 'UTTERANCE_HAS_INVALID_CHARACTERS',
  'SLOT_HAS_INVALID_CHARACTERS': 'SLOT_HAS_INVALID_CHARACTERS',
  'UTTERANCES_NOT_DEFINED_SCHEMA': 'UTTERANCES_NOT_DEFINED_SCHEMA',
  'INTENTS_WITHOUT_UTTERANCES': 'INTENTS_WITHOUT_UTTERANCES',
  'MISSING_LIST_TYPE': 'MISSING_LIST_TYPE',
  'SLOTS_NOT_DEFINED_SCHEMA': 'SLOTS_NOT_DEFINED_SCHEMA',
  'UTTERANCE_USING_SLOT_NOT_SCHEMA': 'UTTERANCE_USING_SLOT_NOT_SCHEMA',
  'UTTERANCE_USING_DUPLICATE_SLOT': 'UTTERANCE_USING_DUPLICATE_SLOT',
  'UTTERANCE_SHOULD_UNIQUE': 'UTTERANCE_SHOULD_UNIQUE',
  'UTTERANCE_EXCEED_LIMIT': 'UTTERANCE_EXCEED_LIMIT',
  'SLOT_EXCEED_LIMIT': 'SLOT_EXCEED_LIMIT',
};


class alexaError {
  constructor() {
    this._errors = [];
  }

  static get ERROR_TYPE() {
    return ERROR_TYPE;
  }

  set add(e) {
    this._errors.push(e);
  }

  get errors() {
    return this._errors;
  }

  print() {
    _.each(this.errors, (e) => {
      console.log(e.type, e.message);
    })
  }
}

module.exports = alexaError;
