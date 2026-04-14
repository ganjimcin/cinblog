import { mount } from 'svelte';
import './style.css'; // Just in case
import CmsApp from './components/admin-cms/CmsApp.svelte';

const app = mount(CmsApp, {
  target: document.getElementById('cms-app-root'),
});

export default app;
