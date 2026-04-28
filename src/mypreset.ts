//mypreset.ts
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

const MyPreset = definePreset(Aura, {
   semantic: {
        primary: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#2563eb',
            600: '#1d4ed8',
            700: '#1e40af',
            800: '#17345f',
            900: '#102a4c',
            950: '#071b33'
        }
    },
    options: {
        cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng'
        }
    }
});

export default MyPreset;
