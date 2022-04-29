const crypto = require('crypto');
const algorithm = 'aes-256-cbc'; //Using AES encryption
const key = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';//crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const ivT = '436eac2cf1a562f264f15cd94f7fca8a';//crypto.randomBytes(16);
const keys = ['com.tonielrosoft.classicludofree', 'com.tonielrosoft.snakeladder',
    'com.tonielro.mygdxgame', 'com.tonielrosoft.naijaludopro', 'com.tonielro.naijawhotfree', 'com.tonielrosoft.hotseat'];

function getKey(token){
    if(token) {
       for (let i = 0; i < keys.length; i++){
           if(keys[i] === token){
               return keys[i];
           }
       }
    }
}

function encrypt(text) {
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(ivT, 'hex'));
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    //return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
    return encrypted.toString('hex');
}
function decrypt(text) {
    try {
        let iv = Buffer.from(ivT, 'hex');
        let encryptedText = Buffer.from(text, 'hex');
        let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }catch (error){
        return "illegal";
    }

}

module.exports = {getKey, encrypt, decrypt};