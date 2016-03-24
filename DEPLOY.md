## Requirement

For Windows, you need [Grsync](https://sourceforge.net/projects/grsync-win/).
In Linux Mint, `rsync` is built-in.

## prd Deployment Configuration

Account: `ceefour@luna3`
Folder: `lumen-trainer/`

For more info, see `Dropbox\Lumen\Lumen devops.docx`.

## How to Deploy to prd

(In Windows, use Git Bash)

In Linux:

    ./build-deploy.sh

In Windows, use Command Prompt: (Note: Git Bash won't work! You'll get `dup() in/out/err failed`)

    build-deploy

## Running the App in prd

    cd ~/lumen-trainer
    ./lumen-trainer.sh
