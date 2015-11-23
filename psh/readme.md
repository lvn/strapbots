

**psh** stands for Pub-Sub Hub. Basically, it's supposed to be an implementation of mention groups.

### Installation
Config goes something like this:

```json
"services": [{
    "name": "pshService",
    "require": "botstrap-psh",
    "config": {
      "redisOpts": {
        "host": "127.0.0.1",
        "port": 6379
      }
    }
  }],
"plugins": [{
    "type": "command",
    "command": "botstrap-psh/command",
    "require": "./command"
  }]
```

### Commands
* `psh sub [groups...]` - subscribe to groups.
* `psh unsub [groups...]` - unsubscribe from groups.
* `psh list` - list groups.
