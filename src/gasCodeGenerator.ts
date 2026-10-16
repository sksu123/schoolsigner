// Generator for Google Apps Script (Code.gs) and standalone Neumorphic index.html
// Synchronized directly from root /Code.gs and /index_gas.html templates
import rawCodeGs from '../Code.gs?raw';
import rawIndexHtml from '../index_gas.html?raw';

export const generateCodeGs = (schoolName: string = '행복초등학교'): string => {
  return rawCodeGs.replace(/행복초등학교/g, schoolName).replace(/담양남초등학교/g, schoolName);
};

export const generateStandaloneHtml = (schoolName: string = '행복초등학교'): string => {
  return rawIndexHtml.replace(/행복초등학교/g, schoolName).replace(/담양남초등학교/g, schoolName);
};

export const generateIndexHtml = generateStandaloneHtml;
