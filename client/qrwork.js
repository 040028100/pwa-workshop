import QrCode from 'qrcode-reader';
import { qrCodeStringToObject } from './utils/qrcode';

/**
 * This dedicated worker performs a single task and then is done
 */

self.onmessage = (evt) => {
  console.log(evt.data.imageBuffer);
  if (evt.data && evt.data.imageBuffer) {
    let { imageBuffer } = evt.data;
    let qr = new QrCode();
    qr.callback = function(error, rawResult) {
      if(error) {
        self.postMessage({ error });
        return;
      }
      let qrData = qrCodeStringToObject(rawResult.result);
      self.postMessage({
        qrData 
      });
    }
    qr.decode(imageBuffer);
  }
}