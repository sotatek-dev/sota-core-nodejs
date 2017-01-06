var AWS           = require('aws-sdk');
var randomstring  = require('randomstring');
var mime          = require('mime-types');
var logger        = require('log4js').getLogger('S3');

var s3Client = new AWS.S3({
  accessKeyId: process.env.S3_KEY,
  secretAccessKey: process.env.S3_SECRET,
});

var ElasticTranscoder = new AWS.ElasticTranscoder({
  accessKeyId: process.env.S3_KEY,
  secretAccessKey: process.env.S3_SECRET,
  region: 'ap-southeast-1',
});

class S3 {

  static _uploadFile(file, bucket, callback, finishUploadCB) {
    var extension = path.extname(file.path);
    var filename = randomstring.generate(40) + extension;
    s3Client.putObject({
      Bucket: bucket,
      Key: filename,
      ACL: 'public-read',
      Body: fs.createReadStream(file.path),
      ContentLength: file.size,
      ContentType: mime.contentType(path.basename(file.path)),
    }, function(err, ret) {
      if (err) {
        return finishUploadCB(err);
      }

      finishUploadCB(null, {
        Bucket: bucket,
        Key: filename,
        ContentLength: file.size
      });
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

  static _uploadImage(file, bucket, callback) {
    this._uploadFile(file, bucket, callback, function(err, ret) {
      if (err) {
        // TODO: rollback/delete the posted media
        logger.error('S3::_uploadImage failed. err=' + util.inspect(err));
        return;
      }

      logger.trace('S3::_uploadImage finished: ' + ret.Key);
    });
  }

  static _uploadVideo(file, bucket, callback) {
    var self = this;
    this._uploadFile(file, bucket, callback, function(err, ret) {
      if (err) {
        // TODO: rollback/delete the posted media
        logger.error('S3::_uploadVideo failed. err=' + util.inspect(err));
        return;
      }

      logger.trace('S3::_uploadVideo finished: ' + ret.Key);

      self._transcodeVideo(ret.Key);
    });
  }

  static _transcodeVideo(key, onFailedCB) {
    // Transcode video file to HLS format
    ElasticTranscoder.createJob({
      PipelineId: process.env.S3_TRANSCODER_PIPELINE,
      Input: {
        Key: key
      },
      Output: {
        Key: key,
        PresetId: '1351620000001-200040',
        ThumbnailPattern: path.basename(key, path.extname(key)) + '_{count}',
      },
    }, function(err, ret) {
      if (err) {
        // TODO: rollback/delete the posted media
        logger.error('S3::_transcodeVideo failed. err=' + util.inspect(err));
        onFailedCB();
        return;
      }

      logger.trace('S3::_transcodeVideo finished: ' + util.inspect(ret));
    });
  }

}

module.exports = S3;
