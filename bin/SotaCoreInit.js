#!/usr/bin/env node
const program     = require('commander');
const fs          = require('fs-extra');
const path        = require('path');
const chalk       = require('chalk');
const FileUtils   = require('../util/FileUtils');
const templateDir = path.resolve(__dirname, '../_templates');

program
  .arguments('<dir_path>')
  .action((dirPath) => {
    const targetDirPath = path.resolve(dirPath);

    if (!FileUtils.isDirectorySync(targetDirPath)) {
      console.error(chalk.red(`Cannot initialize app to invalid directory: ${targetDirPath}`));
      process.exit(1);
    }

    console.log(chalk.green(`Will initialize app in directory: ${targetDirPath}`));

    initEnvFile(targetDirPath);
    initConfigDir(targetDirPath);
    initAppDir(targetDirPath);
  })
  .parse(process.argv);

function initEnvFile(targetDirPath) {
  const envFile = path.join(targetDirPath, '.env');
  if (!fs.existsSync(envFile)) {
    fs.copySync(path.join(templateDir, '.env'), envFile);
    console.log(chalk.green(`✓ Env file: created.`));
  } else {
    console.log(chalk.cyan(`✓ Env file: existed.`));
  }
}

function initConfigDir(targetDirPath) {
  // Make config directory if it doesn't exist
  const configDir = path.join(targetDirPath, 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir);
    console.log(chalk.green(`✓ Config folder: created.`));
  } else {
    console.log(chalk.cyan(`✓ Config folder: existed.`));
  }

  // Make routes directory if it doesn't exist
  const routesDir = path.join(configDir, 'routes');
  if (!fs.existsSync(routesDir)) {
    fs.mkdirSync(routesDir);
    console.log(chalk.green(`✓ Routes folder: created.`));
  } else {
    console.log(chalk.cyan(`✓ Routes folder: existed.`));
  }

  const apiRoutesFile = path.join(routesDir, 'api.js');
  if (!fs.existsSync(apiRoutesFile)) {
    fs.copySync(path.join(templateDir, 'config/routes/api.js'), apiRoutesFile);
    console.log(chalk.green(`✓ API routes file: created.`));
  } else {
    console.log(chalk.cyan(`✓ API routes file: existed.`));
  }

  const webRoutesFile = path.join(routesDir, 'web.js');
  if (!fs.existsSync(webRoutesFile)) {
    fs.copySync(path.join(templateDir, 'config/routes/web.js'), webRoutesFile);
    console.log(chalk.green(`✓ WEB routes file: created.`));
  } else {
    console.log(chalk.cyan(`✓ WEB routes file: existed.`));
  }

  const routesFile = path.join(configDir, 'Routes.js');
  if (!fs.existsSync(routesFile)) {
    fs.copySync(path.join(templateDir, 'config/Routes.js'), routesFile);
    console.log(chalk.green(`✓ Routes config file: created.`));
  } else {
    console.log(chalk.cyan(`✓ Routes config file: existed.`));
  }

  const adaptersFile = path.join(configDir, 'Adapters.js');
  if (!fs.existsSync(adaptersFile)) {
    fs.copySync(path.join(templateDir, 'config/Adapters.js'), adaptersFile);
    console.log(chalk.green(`✓ Adapters config file: created.`));
  } else {
    console.log(chalk.cyan(`✓ Adapters config file: existed.`));
  }

  const localConfigFile = path.join(configDir, 'Local.js');
  if (!fs.existsSync(localConfigFile)) {
    fs.copySync(path.join(templateDir, 'config/Local.js'), localConfigFile);
    console.log(chalk.green(`✓ Local config file: created.`));
  } else {
    console.log(chalk.cyan(`✓ Local config file: existed.`));
  }
}

function initAppDir(targetDirPath) {
  const appDir = path.join(targetDirPath, 'app');
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir);
    console.log(chalk.green(`✓ App folder: created.`));
  } else {
    console.log(chalk.cyan(`✓ App folder: existed.`));
  }

  const controllersDir = path.join(appDir, 'controllers');
  if (!fs.existsSync(controllersDir)) {
    fs.mkdirSync(controllersDir);
    console.log(chalk.green(`✓ Controller folder: created.`));
  } else {
    console.log(chalk.cyan(`✓ Controller folder: existed.`));
  }

  const modelsDir = path.join(appDir, 'models');
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir);
    console.log(chalk.green(`✓ Model folder: created.`));
  } else {
    console.log(chalk.cyan(`✓ Model folder: existed.`));
  }

  const servicesDir = path.join(appDir, 'services');
  if (!fs.existsSync(servicesDir)) {
    fs.mkdirSync(servicesDir);
    console.log(chalk.green(`✓ Service folder: created.`));
  } else {
    console.log(chalk.cyan(`✓ Service folder: existed.`));
  }

  const entitiesDir = path.join(appDir, 'entities');
  if (!fs.existsSync(entitiesDir)) {
    fs.mkdirSync(entitiesDir);
    console.log(chalk.green(`✓ Entity folder: created.`));
  } else {
    console.log(chalk.cyan(`✓ Entity folder: existed.`));
  }

  const appControllerFile = path.join(controllersDir, 'AppController.js');
  if (!fs.existsSync(appControllerFile)) {
    fs.copySync(path.join(templateDir, 'app/controllers/AppController.js'), appControllerFile);
    console.log(chalk.green(`✓ AppController file: created.`));
  } else {
    console.log(chalk.cyan(`✓ AppController file: existed.`));
  }
}
