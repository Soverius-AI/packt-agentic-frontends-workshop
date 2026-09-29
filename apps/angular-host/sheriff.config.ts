import { sameTag, type SheriffConfig } from '@softarc/sheriff-core';

export const sheriffConfig: SheriffConfig = {
  entryFile: 'src/main.ts',
  enableBarrelLess: true,
  modules: {
    'src/app': {
      'shared/<shared>': ['shared'],
      domains: {
        '<domain>/api': ['domain:<domain>', 'type:api'],
        '<domain>/data': ['domain:<domain>', 'type:data'],
        '<domain>/model': ['domain:<domain>', 'type:model'],
        '<domain>/ui': ['domain:<domain>', 'type:ui'],
        '<domain>/feat-<feature>': ['domain:<domain>', 'type:feature'],
      },
    },
  },
  depRules: {
    root: ['type:api', 'type:feature'],
    '*': ['shared'],
    'domain:*': [sameTag],
    'type:api': ['type:feature'],
    'type:feature': ['type:data', 'type:ui', 'type:model'],
    'type:data': ['type:model'],
    'type:ui': ['type:model'],
    'type:model': [],
  },
};
