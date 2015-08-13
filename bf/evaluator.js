

var exports = module.exports = {};


var ops = {
  '>': function(state) {
    state.memPtr++;
  },
  '<': function(state) {
    state.memPtr--;
  },
  '+': function(state) {
    state.memory[state.memPtr] = state.memory[state.memPtr] || 0;
    state.memory[state.memPtr]++;
  },
  '-': function(state) {
    state.memory[state.memPtr] = state.memory[state.memPtr] || 0;
    state.memory[state.memPtr]--;
  },
  '.': function(state) {
    state.memory[state.memPtr] = state.memory[state.memPtr] || 0;
    state.output(state.memory[state.memPtr]);
  },
  ',': function(state) {
    // does nothing for now
  },
  '[': function(state) {
    state.loops.unshift(state.codePtr);
  },
  ']': function(state) {
    if (state.memory[state.memPtr]) {
      state.codePtr = state.loops[0] + 1;
    }
    else {
      state.loops.shift(state.codePtr);
    }
  }
}

exports.bfEval = function bfEval(code, opts) {
  opts.timeout = opts.timeout || 10000;

  var state = {
    memory: {},
    memPtr: 0,
    codePtr: 0,
    loops: [],
    input: opts.input || function(){},
    output: opts.output || function(){}
  };

  var startTime = Date.now();

  // console.log('executing', code);
  while (state.codePtr < code.length) {
    if (Date.now() - startTime > opts.timeout) {
      throw 'Timeout';
    }

    var oldCodePtr = state.codePtr;

    var codeChar = code[state.codePtr];
    var op = ops[codeChar];
    op && op(state);

    if (state.codePtr === oldCodePtr) {
      state.codePtr++;
    }
  }
};
