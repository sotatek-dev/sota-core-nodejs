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

  static _uploadImage(file, bucket, callback, finishUploadCB) {
    this._uploadFile(file, bucket, callback, function(err, ret) {
      if (err) {
        // TODO: rollback/delete the posted media
        logger.error('S3::_uploadImage failed. err=' + util.inspect(err));
        return;
      }

      logger.error('S3::_uploadImage finished. ret=' + util.inspect(ret));
      var extension = path.extname(file.path);
      var filename = randomstring.generate(40) + extension;
      var fileUrl = util.format(
        'https://s3-ap-southeast-1.amazonaws.com/%s/%s',
        bucket, filename
      );

      return finishUploadCB(null, {
        fileUrl: fileUrl,
        thumbnailUrl: fileUrl
      });
    });
  }

  static _uploadVideo(file, bucket, callback, finishUploadCB) {
    var self = this;
    this._uploadFile(file, bucket, callback, function(err, ret) {
      if (err) {
        // TODO: rollback/delete the posted media
        logger.error('S3::_uploadVideo failed. err=' + util.inspect(err));
        return;
      }

      logger.trace('S3::_uploadVideo finished: ' + ret.Key);

      self._transcodeVideo(ret.Key, finishUploadCB);
    });
  }

  static _transcodeVideo(key, callback) {
    var thumbnailPattern = path.basename(key, path.extname(key)) + '_{count}';
    // Transcode video file to HLS format
    ElasticTranscoder.createJob({
      PipelineId: process.env.S3_TRANSCODER_PIPELINE,
      Input: {
        Key: key
      },
      Output: {
        Key: key,
        PresetId: '1351620000001-200040',
        ThumbnailPattern: thumbnailPattern,
      },
    }, function(err, ret) {
      if (err) {
        // TODO: rollback/delete the posted media
        logger.error('S3::_transcodeVideo failed. err=' + util.inspect(err));
        callback(err);
        return;
      }

      logger.trace('S3::_transcodeVideo finished: ' + util.inspect(ret));
      var fileUrl = util.format(
        'https://s3-ap-southeast-1.amazonaws.com/%s/%s',
        process.env.S3_BUCKET_VIDEO, key
      );

      var thumbnailUrl = util.format(
        'https://s3-ap-southeast-1.amazonaws.com/%s/%s',
        process.env.S3_BUCKET_THUMBNAIL, thumbnailPattern.replace('{count}', '00001') + '.png'
      );

      return callback(null, {
        fileUrl: fileUrl,
        thumbnailUrl: thumbnailUrl
      });
    });
  }

}

module.exports = S3;
