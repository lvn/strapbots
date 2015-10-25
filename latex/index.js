'use strict';

var q = require('q'),
  cp = require('child-process-promise'),
  fs = require('q-io/fs'),
  qs = require('querystring'),
  http = require("q-io/http"),
  path = require('path'),
  uuid = require('uuid'),
  lfmt = require('lfmt'),
  imgur = require('imgur');

var template;

// add extension to a name if it doesn't already have one.
var addExtension = function(name, ext) {
  return path.extname(name) ? name : [name, ext].join('.');
};

var titleize = function titleize(src) {
  var lines = src.split(/\n/g);
  return lines[0] + (lines[1] ? '...' : '');
};

// compile latex code into a png.
var compileLatex = function compileLatex(src, templateFile, outputDir, cb) {
  var fname = uuid.v4(),
    outputDir = path.resolve(outputDir),
    fnametex = addExtension(fname, 'tex'),
    fnamepdf = addExtension(fname, 'pdf'),
    fnamepng = addExtension(fname, 'png'),
    pathtex = path.join(outputDir, fnametex),
    pathpdf = path.join(outputDir, fnamepdf),
    pathpng = path.join(outputDir, fnamepng);

  var latexSrc;

  return q.fcall(function checkTemplate() {
    return q.when(template ||
      fs.read(path.join(__dirname, templateFile)));
  }).then(function checkOutputDir(_template) {
    template = _template;

    src = src.replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    latexSrc = lfmt.format(template, {
      commandLatexSource: src
    });
    return fs.isDirectory(outputDir);
  }).then(function makeOutputDir(isDirectory) {
    return q.when(isDirectory || fs.makeDirectory(outputDir));
  }).then(function compileLatexCode() {
    return fs.write(pathtex, latexSrc);
  }).then(function compileLatex() {
    return cp.spawn('pdflatex', [
      '-aux-directory=' + outputDir,
      '-output-directory=' + outputDir,
      pathtex]);
  }).then(function convertToPng() {
    return cp.spawn('convert', [
      '-density', '300', pathpdf,
      '-quality', '90', pathpng])
  })
  .then(function() {
    return pathpng;
  })
};

var main = function main(argv, channel, response, logger, config) {
  var src = argv.slice(1).join(' ');
  imgur.setClientId(config.clientId);
  logger.log('got latex request', src);
  compileLatex(src, config.templateFile, config.outputDir)
    .then(function(filepath) {
      return q(imgur.uploadFile(filepath));
    })
    .then(function(res) {
      response.end(lfmt.format('`{{title}}`: ', {
        title: titleize(src)
      }) + res.data.link);
    })
    .catch(function(err) {
      logger.error(err);
      response.end(config.errMsgs.generic);
    });
};

main.metadata = require('./plugin');

module.exports = main;
