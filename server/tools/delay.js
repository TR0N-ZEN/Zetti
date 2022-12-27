/**
 * 
 * @param {number} milliseconds 
 * @returns Promise which resolves after given amount of miliseconds
 */
function delay(milliseconds)
{
  // crete new promise object with
  return new Promise( (resolve) => {
  
    // setTimeout is a function executing the first argument after the second argument is
    setTimeout( () => { resolve();}, milliseconds);
  });
}
module.exports.delay = delay;