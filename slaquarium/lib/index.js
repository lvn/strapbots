

module.exports.Aquarium = require('./aquarium');



module.exports.testDraw = function testDraw(w, h) {
  return require('./draw').drawBox(w, h, [['x', 'x', 'x'], ['x', ' ', 'x'], ['x', 'x', 'x']]);
};
