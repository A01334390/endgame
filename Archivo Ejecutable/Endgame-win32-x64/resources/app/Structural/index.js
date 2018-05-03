//System related libraries
const fs = require('fs')
const path = require('path')
// CLI ELEMENTS
const chalk = require('chalk') //Prints output with colors
const clear = require('clear') //Clears the CLI
const inquirer = require('inquirer') //Shows an interactive CLI menu
const Table = require('cli-table') //Shows beautiful Tables
const figlet = require('figlet') //Displays strings as figlets
const math = require('mathjs') //Mathematical Library
const gradient = require('gradient-string'); //Outputs text as gradients
const superb = require('superb'); //Superb words
const cows = require('cows');
//Homemade classes
const convert = require('./Algorithms/converter');


/**
 * CLI METHODS THAT CAN BE ACCEPTED
 */
var yargs = require('yargs')
    .command('author',"Shows information about the program's author")
    .command('convert',"Converts the λ-NFA to a DFA from the JSON File")
    .help()
    .argv;

switch(yargs._[0]){
    case 'author':

    break;

    case 'convert':
        convert.convert()
    break;

    default:
        console.log(chalk.green("This functionality doesn't exist yet,"),chalk.blue("please try again in future versions."))
    break;
}

