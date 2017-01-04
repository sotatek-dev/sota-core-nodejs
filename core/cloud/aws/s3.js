var multiparty    = require('multiparty');
var AWS           = require('aws-sdk');
var logger        = require('log4js').getLogger('Cloud.S3');
var randomstring  = require('randomstring');
var mime          = require('mime-types');

var s3Client = new AWS.S3({
  accessKeyId: process.env.S3_KEY,
  secretAccessKey: process.env.S3_SECRET,
});

class S3 {

  static _uploadFile(file, bucket, callback) {
    var extension = path.extname(file.path);
    var filename = randomstring.generate(40) + extension;
    s3Client.putObject({
      Bucket: bucket,
      Key: filename,
      ACL: 'public-read',
      Body: fs.createReadStream(file.path),
      ContentLength: file.size,
      ContentType: mime.contentType(path.basename(file.path)),
    }, function(err) {
      if (err) {
        throw err;
      }
    });

    // TODO: get correct url by region
    // TODO: generate real thumbnail
    var fileUrl = util.format(
      'https://s3-ap-southeast-1.amazonaws.com/%s/%s',
      bucket, filename
    );

    return callback(null, {
      fileUrl: fileUrl,
      thumbnailUrl: fileUrl
    });
  }

}

module.exports = S3;
