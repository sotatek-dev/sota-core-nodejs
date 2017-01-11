var Utils = {};

Utils.capitalizeFirstLetter = function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

Utils.convertToCamelCase = function(key) {
  return key.toLowerCase().replace( /_./g, function(matched) {
    return matched.charAt(1).toUpperCase();
  });
};

Utils.convertToSnakeCase = function(key) {
  return key.replace( /[a-z][A-Z]/g, function(matched) {
    return matched.charAt(0) + '_' + matched.charAt(1).toLowerCase();
  }).toLowerCase();
};

Utils.emailUsername = function(emailAddress) {
  var match = emailAddress.match(/^(.+)@/);
  if (!match) {
    return null;
  }
  return match[1];
};

Utils.getRandomInRange = function(min, max) {
  return (min + Math.floor(Math.random() * (max-min)));
};

Utils.getRandomByProb = function(probs, propName) {
  var result = null;
  var totalProb = 0;
  var i, prob;
  for (i = 0, len = probs.length; i < len; i++) {
    prob = probs[i];
    totalProb += prob[propName];
  }
  var prob1 = Utils.getRandomInRange(0, totalProb);
  var prob2 = 0;
  for (i = 0,len = probs.length; i < len; i++) {
    prob = probs[i];
    prob2 += prob[propName];
    if (prob1 < prob2){
      result = prob;
      break;
    }
  }
  return result;
};

Utils.strToTimeInMillis = function(str) {
  return (new Date(str)).getTime();
};

Utils.nowInMilis = function() {
  return Date.now();
};

Utils.now = function() {
  return Utils.nowInMilis();
};

Utils.nowInSeconds = function() {
  return Utils.nowInMilis()/1000|0;
};

Utils.escapeSqlColumn = function(column) {
  return '`' + column + '`';
};

Utils.getS3FileUrl = function(region, bucket, fileName) {
  return util.format('https://s3-%s.amazonaws.com/%s/%s', region, bucket, fileName);
};

module.exports = Utils;
