# Alpaca web UI

UI for talking to Alpaca AI 

# How it looks

![](https://github.com/LaraGuardiola/nodejs-dalai-alpaca-ai/blob/main/public/assets/alpaca.gif)

# Previous requirements

* Node.js >= 18.15
* Desktop development with C++
* Python development kit
* Have at least one model such as alpaca or llama installed.
* pnpm package manager


# Installation (Windows)

The first three requirements can be obtained by downloading Microsoft Visual studio through the following link: [Microsoft Visual studio](https://visualstudio.microsoft.com/downloads/)

In case you don't have pnpm in your system it can be installed with the following command:
```bash
  npm install -g pnpm
```

Inside the the directory type the following command:
```bash
  pnpm install
```

And then:
```bash
  pnpm start
```

Finally just open your browser on http:localhost:3000.

# Considerations

At the moment Dalai is looking for the models in the default root which is usually C:\Users\username\dalai\alpaca\models

If you already have the models installed in another directory, you can easily change the path that Dalai reads by going to the alpaca.js file, just when Dalai is instantiated in line 3.

```bash
  const dalai = const dalai = new Dalai(PATH)
```
Enjoy! :)



![Logo](https://github.com/LaraGuardiola/nodejs-dalai-alpaca-ai/blob/main/public/assets/alpaca.jpg)