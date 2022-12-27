const mod = require('./mod').mod;

/**
 * 
 * @param {Object[]} array 
 * @returns random element of the array
 */
function get_random_element(array)
{
  let index = mod(Math.floor(Math.random() * array.length), array.length);
  return array[index];
}

module.exports.get_random_element = get_random_element;