"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.z32 = exports.generateKeyPair = exports.dns = exports.default = exports.SignedPacket = exports.Pkarr = void 0;
var _dht = require("./lib/dht.js");
var _z = _interopRequireDefault(require("z32"));
var _dnsPacket = _interopRequireDefault(require("dns-packet"));
var _tools = require("./lib/tools.js");
var _signed_packet = _interopRequireDefault(require("./lib/signed_packet.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const SignedPacket = exports.SignedPacket = _signed_packet.default;
const z32 = exports.z32 = _z.default;
const dns = exports.dns = _dnsPacket.default;
const generateKeyPair = exports.generateKeyPair = _tools.generateKeyPair;
class Pkarr {
  static generateKeyPair = _tools.generateKeyPair;
  static generateSeed = _tools.randomBytes;

  /**
   * Publishes a signed packet using relay. returns the Fetch response.
   *
   * @param {string} relay - Relay url
   * @param {SignedPacket} signedPacket
   */
  static async relayPut(relay, signedPacket) {
    const id = z32.encode(signedPacket.publicKey());
    const url = relay.replace(/\/+$/, '') + '/' + id;
    return fetch(url, {
      method: 'PUT',
      body: signedPacket.bytes()
    });
  }

  /**
   * Publishes a signed packet using relay. returns the Fetch response.
   *
   * @param {string} relay - Relay url
   * @param {Uint8Array} publicKey
   */
  static async relayGet(relay, publicKey) {
    const id = z32.encode(publicKey);
    const url = relay.replace(/\/+$/, '') + '/' + id;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      } else {
        throw new Error(response.statusText);
      }
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    return SignedPacket.fromBytes(publicKey, bytes);
  }

  /**
   * Publishes a signed packet to the DHT.
   * Throws an error in browser environment.
   *
   * @param {SignedPacket} signedPacket
   *
   * @returns {Promise<boolean>}
   */
  static async publish(signedPacket) {
    const dht = new _dht.DHT({
      storageLocation: _dht.DEFAULT_STORAGE_LOCATION
    });
    return dht.put(signedPacket.bep44Args()).then(() => true).catch(() => false).finally(() => dht.destroy());
  }

  /**
   * Resolves a signed packet from the DHT.
   * Throws an error in browser environment.
   *
   * @param {Uint8Array | string} key
   * @param {object} [options]
   * @param {boolean} [options.fullLookup=false] - perform a full lookup through the DHT, defaults to false, meaning it will return the first result it finds
   *
   * @throws {Error<'Invalid key'>}
   * @returns {Promise<{signedPacket: SignedPacket, nodes: {host: string, port: number}[]} | null>}
   */
  static async resolve(key, options = {}) {
    const dht = new _dht.DHT({
      storageLocation: _dht.DEFAULT_STORAGE_LOCATION
    });
    try {
      const result = await dht.get((0, _tools.decodeKey)(key), options).finally(() => dht.destroy());
      if (!result) return null;
      return {
        signedPacket: SignedPacket.fromBep44Args(result),
        nodes: result.nodes
      };
    } catch (error) {
      dht.destroy();
      throw error;
    }
  }
}
exports.Pkarr = Pkarr;
var _default = exports.default = Pkarr;
/**
 * @typedef {import('./lib/signed_packet.js').Packet} Packet
 * @typedef {import('./lib/signed_packet.js').default} SignedPacket
 */
