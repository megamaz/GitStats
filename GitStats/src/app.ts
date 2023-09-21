import { app, BrowserWindow } from 'electron';
import Main from './main';

Main.dataSetup();
Main.main(app, BrowserWindow);