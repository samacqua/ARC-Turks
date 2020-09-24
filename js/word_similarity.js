function subVecs(a, b) {
  return a.map(function (val, idx) {
    return val - b[idx];
  });
}

function mag(a) {
  return Math.sqrt(a.reduce(function (sum, val) {
    return sum + val * val;
  }, 0));
}

function get_dist(vec1, vec2) {
  return mag(subVecs(vec1, vec2));
}
