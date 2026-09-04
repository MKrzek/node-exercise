PM2 - clustering

A single Node process uses one core. To use all cores on a machine, you run multiple instances of your app and distribute incoming traffic across them — that's what cluster and PM2 give you, and it's the foundation of horizontal scaling.

Right — in cluster mode, PM2 is not creating worker threads inside one Node process. It is creating multiple Node processes, and each one is a full instance of your app.

The correct mental model
One Node process = one event loop, one memory space, one V8 instance.

Cluster / PM2 workers = multiple separate Node processes.

Each process runs your app code independently.

So the right phrase is:

PM2 starts multiple processes, and each process is an instance of my app.

**Use this wording in your course notes:**

Process = a running copy of the Node app.

Cluster worker / PM2 worker = one of those running copies.

Worker threads = different thing entirely; threads inside one process.

So yes: use “processes” when talking about PM2 cluster mode. If you say “worker processes,” that’s still correct — just remember they are full Node processes, not threads

**pm2 stop all**

Stop all PM2 apps

_pm2 stop all_
Remove all PM2 apps from the PM2 list

**pm2 delete all**
Kill the PM2 daemon itself

**pm2 kill**
pm2 kill is the “shut PM2 down completely” command.

If you also want all Node processes killed

for when pm2 is only installed globally

npx pm2 stop all
npx pm2 delete all
npx pm2 kill

_PATH_

Think of PATH as the shell’s _search list for commands_. When you type pm2, your terminal looks through each folder in PATH until it finds a program named pm2; if none of those folders contain it, you get “command not found

If PATH contains:

/usr/local/bin:/usr/bin:/bin
and you type:

ls
the shell checks those folders in order, finds ls, and runs it. That’s why you can type ls without writing the full path like /bin/ls.

_Best mental model_
_Global PATH = folders your whole terminal knows about._

Project local bin = commands available only when npm runs scripts or when you use npx.

command not found = the shell looked through the search list and didn’t see that command.

If you want, I can show you the exact difference b
