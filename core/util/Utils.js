var Utils = {};

Utils.capitalizeFirstLetter = function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

Utils.normalizeFirstLetter = function(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
};

Utils.convertToCamelCase = function(key) {
  if (key.indexOf('_') < 0) {
    return Utils.normalizeFirstLetter(key);
  }

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
  if (!propName) {
    propName = 'prob';
  }

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

Utils.getCDNUrl = function(folder, fileName) {
  return util.format('%s%s/%s', process.env.CDN_URL, folder, fileName);
};

Utils.encrypt = function(text) {
  if (!text) {
    return null;
  }

  if (_.isPlainObject(text)) {
    text = JSON.stringify(text);
  } else if (typeof text !== 'string') {
    text = text.toString();
  }

  var cipher = crypto.createCipher('aes-256-ctr', process.env.SECRET);
  var crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
};

Utils.decrypt = function(text) {
  if (!text) {
    return null;
  }

  var decipher = crypto.createDecipher('aes-256-ctr', process.env.SECRET);
  var dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
};

Utils.removeVneseSign = function(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
          .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,'a')
          .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,'e')
          .replace(/ì|í|ị|ỉ|ĩ/g,'i')
          .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,'o')
          .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,'u')
          .replace(/ỳ|ý|ỵ|ỷ|ỹ/g,'y')
          .replace(/đ/g,'d');
};

Utils.removeSpecialCharacters = function(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  var pattern = /!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'| |\"|\&|\#|\[|\]|~|$|_/g;
  return text.replace(pattern, '');
};

module.exports = Utils;
