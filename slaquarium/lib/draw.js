
var exports = module.exports = {};

var arrayEqual = exports.arrayEqual = function arrayEqual(a, b) {
  if (a.length != b.length) {
    return false;
  }

  return !a.some(function(item, indx) {
    return (item !== b[indx]);
  });
};

// define the tiles in terms of a 3x3 array.
exports.drawBox = function drawBox(width, height, tiles) {
  defaultTiles = [
    ['┌', '─', '┐'],
    ['│', ' ', '│'],
    ['└', '─', '┘']
  ];

  tiles = tiles || [];
  defaultTiles.forEach(function(row, y) {
    tiles[y] = tiles[y] || [];
    row.forEach(function(tile, x) {
      tiles[y][x] = tiles[y][x] || row[x];
    });
  });


  return Array.apply(null, new Array(height))
    .map(function(_, y) {
      return Array.apply(null, new Array(width))
        .map(function(_, x) {
          // check corners
          if (arrayEqual([0, 0], [x, y])) {
            return tiles[0][0];
          }

          if (arrayEqual([0, 1], [x, height - y])) {
            return tiles[2][0];
          }

          if (arrayEqual([1, 0], [width - x, y])) {
            return tiles[0][2];
          }

          if (arrayEqual([1, 1], [width - x , height - y])) {
            return tiles[2][2];
          };

          // check edges
          if (x === 0) {
            return tiles[1][0];
          }

          if (width - x === 1) {
            return tiles[1][2];
          }

          if (y === 0) {
            return tiles[0][1];
          }

          if (height - y === 1) {
            return tiles[2][1];
          }

          // return middle
          return tiles[1][1];
        }).join('');
    }).join('\n');
};
