"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomString = exports.processSpotifyLink = void 0;
/**
 * Processes a link into a valid Spotify URI
 *
 * @param link Spotify link/URI to be processed
 */
function processSpotifyLink(link) {
    const match = link.match(/^([A-Z0-9]{4}) (https:\/\/open\.spotify\.com\/track\/|spotify:track:)(.{22})/);
    if (match) {
        return [match[1], 'spotify:track:' + match[3]];
    }
    else {
        return [null, null];
    }
}
exports.processSpotifyLink = processSpotifyLink;
/**
 * generates a random string
 *
 * @param length - length of string to generate
 */
exports.generateRandomString = function (length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};
