_NPX vs NPM_

_npm is for installing and managing packages; npx is for running package commands._

npm
Use npm when you want to:

install dependencies,

remove packages,

update packages,

run scripts defined in package.json.

Example:

npm install pm2
npm run build
npx
**Use npx when you want to execute a package binary without worrying about whether it’s global or local. It looks for the command in your project’s local binaries first, and can also fetch/run packages temporarily if needed.**

Example:

npx pm2 start dist/src/server.js -i max --name express-learning-tracker
Easy way to remember
npm = manage packages

npx = run packages

In your project
Since PM2 is installed locally in devDependencies, _npm run cluster_ works because npm adds node_modules/.bin to the script environment. _npx pm2_ ... also works because npx knows how to find local binaries.

So for you:

npm install adds packages.

_npm run cluster_ runs your PM2 command.

_npx pm2_ ... runs PM2 directly from the local project copy

**BINARY**
What a binary is
**A binary is just an executable command. It’s the program your shell runs when you type a command name.**

For example:
**ls** is a binary on your system.
_pm2_ is the binary provided by the PM2 package.
_tsc_ is the binary provided by TypeScript.

_Where package binaries live_
When you install a package locally, npm puts its binaries in: node_modules/.bin
That folder contains little launcher links/scripts for the package CLIs.

_Why npm run can see them_
When you run an npm script, npm automatically adds node_modules/.bin to the command search path for that script. So inside this script:

"build": "tsc -p tsconfig.build.json"
npm knows where tsc is, even though you didn’t type the full path

**Why your terminal can’t see them directly**
Your normal terminal session does not automatically search node_modules/.bin. So if PM2 is only installed locally, typing:

pm2 start ...
fails, because your shell doesn’t know where pm2 lives. But:

npx pm2 start ...
or

npm run cluster
works because npm temporarily adds that folder for the command.

In your case
PM2 is a package, and _its binary is the CLI you’re trying to run_. Since you installed it in devDependencies, the binary is project-local, so it lives in ./node_modules/.bin/pm2, not on your system PATH by default

Short version
Package = the installed library/tool.

**Binary = the command from that package**.

**node_modules/.bin = where local package binaries are linked.**

npm run / npx = ways to access those binaries without global install

when you run an npm script, npm temporarily adds your project’s node_modules/.bin folder to the command search path, so commands like pm2 and tsc work even though they’re only installed locally.

_What PATH is doing here_
Your shell normally searches only the folders listed in its PATH. If pm2 is not in one of those folders, typing pm2 fails.

When you run: npm run cluster
_npm starts a child shell and prepends node_modules/.bin to PATH for that script. That means the shell can now find local commands like pm2 or tsc without you typing the full path._

Example with your project
If your package.json has:

json
{
"scripts": {
"cluster": "pm2 start dist/src/server.js -i max --name express-learning-tracker"
}
}
then npm runs that script with PATH effectively including your project binaries. So pm2 resolves to:

./node_modules/.bin/pm2
even though your normal terminal wouldn’t find it.

_Why npx also works_
npx does something similar: it looks for a local binary first, then runs it. So npx pm2 start ... works because it can find the PM2 binary in your project dependencies.

**Mental model**
Think of it like this:

**Normal terminal: only knows system folders.**
_npm run: temporarily adds your project’s toolbox folder to the search list._

_npx: directly looks in that toolbox for the command._

So the short answer is: npm scripts modify PATH for the duration of the script so local package binaries are runnable by name.

**npx is used because Prisma CLI is installed as a dev dependency in your project, not globally.**

Why npx?
npx = "npm execute"

It runs a package's binary from your local node_modules/.bin folder without needing to install it globally.

Your setup
In your package.json, you likely have:
