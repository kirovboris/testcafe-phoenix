import chalk from 'chalk';
import { getInstallations as getBrowserInstallations } from 'testcafe-browser-natives';
import CliArgumentParser from './argument-parser';
import log from './log';
import remotesWizard from './remotes-wizard';
import createTestCafe from '../';

function exit (code) {
    log.hideSpinner();

    // NOTE: give a process time to flush the output.
    // It's necessary in some environments.
    setTimeout(() => process.exit(code), 0);
}

function error (err) {
    log.hideSpinner();

    log.write(chalk.red('ERROR ') + err.message);
    log.write(chalk.gray('Type "tescafe -h" for help.'));

    exit(1);
}

async function runTests (argParser) {
    var opts  = argParser.opts;
    var port1 = opts.ports && opts.ports[0];
    var port2 = opts.ports && opts.ports[1];

    log.showSpinner();

    var testCafe       = await createTestCafe(opts.hostname, port1, port2);
    var remoteBrowsers = await remotesWizard(testCafe, argParser.remoteCount, opts.qrCode);
    var browsers       = argParser.browsers.concat(remoteBrowsers);
    var runner         = testCafe.createRunner();

    runner
        .src(argParser.src)
        .browsers(browsers)
        .reporter(opts.reporter)
        .filter(argParser.filter)
        .screenshots(opts.screenshots, opts.screenshotsOnFails);

    runner.once('done-bootstrapping', () => log.hideSpinner());

    var failed = await runner.run({
        skipJsErrors:   opts.skipJsErrors,
        quarantineMode: opts.quarantineMode
    });

    exit(failed);
}

async function listBrowsers () {
    var installations = await getBrowserInstallations();
    var aliases       = Object.keys(installations);

    console.log(aliases.join('\n'));
    exit(0);
}


(async function cli () {
    try {
        var argParser = new CliArgumentParser();

        await argParser.parse(process.argv);

        if (argParser.opts.listBrowsers)
            listBrowsers();
        else
            await runTests(argParser);
    }
    catch (err) {
        error(err);
    }
})();

