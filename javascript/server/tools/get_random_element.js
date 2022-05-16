const mod = require('./mod').mod;

function get_random_element(/*array*/array)
{
  let index = mod(Math.floor(Math.random() * array.length), array.length);
  return array[index];
}

module.exports.get_random_element = get_random_element;