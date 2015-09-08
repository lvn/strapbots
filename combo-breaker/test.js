'use strict';

var chai = require("chai"),
  expect = chai.expect,
  sinon = require('sinon'),
  sinonChai = require("sinon-chai"),
  comboBreaker = require('./');
chai.use(sinonChai);


describe('comboBreaker', function() {
  it('works', function() {

    var mockMessage = {
      text: 'foo'
    };
    var mockChannel = {
      id: '1'
    };
    var mockResponseObj = {
      end: sinon.spy()
    };
    var mockLogger = {
      log: function(){}
    };

    comboBreaker(mockMessage, mockChannel, mockResponseObj, mockLogger);
    comboBreaker(mockMessage, mockChannel, mockResponseObj, mockLogger);
    expect(mockResponseObj.end).to.have.been.calledWith('C-C-C-COMBO BREAKER');
  });

  it('doesn\'t call response.end if message only appears once', function() {

    var mockMessage = {
      text: 'bar'
    };
    var mockChannel = {
      id: '1'
    };
    var mockResponseObj = {
      end: sinon.spy()
    };
    var mockLogger = {
      log: function(){}
    };

    comboBreaker(mockMessage, mockChannel, mockResponseObj, mockLogger);
    expect(mockResponseObj.end).not.to.have.been.called;
  });

  it('doesn\'t call response.end if message appears in different channels', function() {

    var mockMessage = {
      text: 'baz'
    };
    var mockChannel1 = {
      id: '1'
    };
    var mockChannel2 = {
      id: '2'
    };
    var mockResponseObj = {
      end: sinon.spy()
    };
    var mockLogger = {
      log: function(){}
    };

    comboBreaker(mockMessage, mockChannel1, mockResponseObj, mockLogger);
    comboBreaker(mockMessage, mockChannel2, mockResponseObj, mockLogger);
    expect(mockResponseObj.end).not.to.have.been.called;
  });
});
