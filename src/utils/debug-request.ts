import axios from 'axios';

const debugRequest = axios.create({ validateStatus: () => true });

export { debugRequest };
