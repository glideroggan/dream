import * as fs from 'fs';
import * as path from 'path';

export function htmlUpdaterPlugin(options) {
  return {
    name: 'html-updater',
    setup(build) {
      build.onEnd(result => {
        const outdir = build.initialOptions.outdir;
        // Assuming index.html is in the project root and you're copying it to outdir
        let html = fs.readFileSync(`./src/${options.indexName}`, 'utf8');
        Object.keys(result.metafile.outputs).forEach(v => {
          // get only script name, not definition scripts (like .d.ts or .map files)
          if (v.endsWith('.d.ts') || v.endsWith('.map')) {
            return;
          }
          // console.debug(v);
          let scriptHash = path.basename(v);
          // console.debug('basename: ', scriptHash);
          
          // replace the hash at the end with nothing to get the base name
          const baseScriptName = scriptHash.replace(/-[a-zA-Z0-9]{8}\.js/, '.js');
          scriptHash = scriptHash;
          // console.debug('baseScriptName: ', baseScriptName);
          
          // // extract the base name of the script (without hash)
          // const baseScriptName = scriptHash.split('-').slice(0, -1).join('-') + '.js';
          // find the base script name in the html
          const regex = new RegExp(`${baseScriptName}`, 'g');
          if (!html.match(regex)) {
            return;
          }
          // replace the base script name with the hashed script name
          // console.debug(`replacing ${baseScriptName} with /${scriptHash}`);
          html = html.replace(regex, scriptHash);
        });

        fs.writeFileSync(path.join(outdir, 'index.html'), html);
      });
    }
  }
}

// export const htmlUpdaterPlugin = ;
