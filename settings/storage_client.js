// @flow
class RemoteStorage {
  // https://syusui-s.github.io/YouTubeCommentNotifier.user.js/settings/storage.html
  /*::
    iframe: HTMLIFrameElement
    storageUrl: string
    storageOrigin: string
  */
  constructor(storageUrl) {
    const iframe = document.createElement('iframe');

    iframe.src = storageUrl;
    iframe.style.display = 'none';
    window.document.body.appendChild(iframe);

    Object.assign(this, {
      iframe,
      storageUrl,
      storageOrigin: new URL(storageUrl).origin,
    });
  }

  async request(message/* : { type: string, payload: {} } */, timeout = 5000) {
    const requestId = Math.random();
    const messageStr = JSON.stringify({ ...message, requestId });

    this.iframe.contentWindow.postMessage(messageStr, this.storageOrigin);

    return this.listen(requestId, timeout);
  }

  async listen(expectedRequestId, timeout) {
    return new Promise((resolve, reject) => {
      const listener = event => {
        if (event.origin !== this.storageOrigin)
          return;

        const data = JSON.parse(event.data);

        if (data.requestId !== expectedRequestId)
          return;

        window.removeEventListener('message', listener);
        resolve(data);
      };

      setTimeout(() => {
        reject({ type: 'LOCAL_TIMEOUT' });
        window.removeEventListener('message', listener);
      }, timeout);

      window.addEventListener('message', listener, false);
    });
  }

  async getItem(key) {
    const { type, payload } = await this.request({
      type: 'GET_ITEM',
      payload: { key },
    });

    switch (type) {
    case 'OK':
      return payload.value;
    default:
      throw new TypeError(`Unknown type '${type}'`);
    }
  }

  async setItem(key, value) {
    const { type } = await this.request({
      type: 'SET_ITEM',
      payload: { key, value },
    });

    switch (type) {
    case 'OK':
      return;
    default:
      throw new TypeError(`Unknown type '${type}'`);
    }
  }

}
