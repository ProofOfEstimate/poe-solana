export type Poe = {
  version: "0.1.0";
  name: "poe";
  instructions: [
    {
      name: "initialize";
      accounts: [
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "state";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "escrowAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "registerUser";
      accounts: [
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "user";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "createPoll";
      accounts: [
        {
          name: "creator";
          isMut: true;
          isSigner: true;
        },
        {
          name: "resolver";
          isMut: false;
          isSigner: false;
        },
        {
          name: "state";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poll";
          isMut: true;
          isSigner: false;
        },
        {
          name: "scoringList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "question";
          type: "string";
        },
        {
          name: "description";
          type: "string";
        },
        {
          name: "category";
          type: "u16";
        },
        {
          name: "decay";
          type: "f32";
        }
      ];
    },
    {
      name: "makeEstimate";
      accounts: [
        {
          name: "forecaster";
          isMut: true;
          isSigner: true;
        },
        {
          name: "user";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poll";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userEstimate";
          isMut: true;
          isSigner: false;
        },
        {
          name: "pollEstimateUpdate";
          isMut: true;
          isSigner: false;
        },
        {
          name: "scoringList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userScore";
          isMut: true;
          isSigner: false;
        },
        {
          name: "forecasterTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "escrowAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "lowerEstimate";
          type: "u16";
        },
        {
          name: "upperEstimate";
          type: "u16";
        }
      ];
    },
    {
      name: "updateEstimate";
      accounts: [
        {
          name: "forecaster";
          isMut: true;
          isSigner: true;
        },
        {
          name: "poll";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userEstimate";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userEstimateUpdate";
          isMut: true;
          isSigner: false;
        },
        {
          name: "estimateUpdate";
          isMut: true;
          isSigner: false;
        },
        {
          name: "scoringList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userScore";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "newLowerEstimate";
          type: "u16";
        },
        {
          name: "newUpperEstimate";
          type: "u16";
        }
      ];
    },
    {
      name: "removeEstimate";
      accounts: [
        {
          name: "forecaster";
          isMut: true;
          isSigner: true;
        },
        {
          name: "user";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poll";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userEstimate";
          isMut: true;
          isSigner: false;
        },
        {
          name: "estimateUpdate";
          isMut: true;
          isSigner: false;
        },
        {
          name: "scoringList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userScore";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "resolvePoll";
      accounts: [
        {
          name: "resolver";
          isMut: true;
          isSigner: true;
        },
        {
          name: "poll";
          isMut: true;
          isSigner: false;
        },
        {
          name: "scoringList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "result";
          type: "bool";
        }
      ];
    },
    {
      name: "collectPoints";
      accounts: [
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "forecaster";
          isMut: false;
          isSigner: false;
        },
        {
          name: "user";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poll";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userEstimate";
          isMut: true;
          isSigner: false;
        },
        {
          name: "scoringList";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userScore";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "forecasterTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "poeState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "numPolls";
            type: "u64";
          },
          {
            name: "score";
            type: "f32";
          },
          {
            name: "recalibrationFactor";
            type: "f32";
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "pollEstimateUpdate";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poll";
            type: "publicKey";
          },
          {
            name: "slot";
            type: "u64";
          },
          {
            name: "timestamp";
            type: "i64";
          },
          {
            name: "estimate";
            type: {
              option: "u32";
            };
          },
          {
            name: "variance";
            type: {
              option: "f32";
            };
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "poll";
      type: {
        kind: "struct";
        fields: [
          {
            name: "creator";
            type: "publicKey";
          },
          {
            name: "resolver";
            type: "publicKey";
          },
          {
            name: "id";
            type: "u64";
          },
          {
            name: "category";
            type: "u16";
          },
          {
            name: "bettingAmount";
            type: "u64";
          },
          {
            name: "startSlot";
            type: "u64";
          },
          {
            name: "endSlot";
            type: {
              option: "u64";
            };
          },
          {
            name: "decayRate";
            type: "f32";
          },
          {
            name: "collectiveEstimate";
            type: {
              option: "u32";
            };
          },
          {
            name: "variance";
            type: {
              option: "f32";
            };
          },
          {
            name: "lnGm";
            type: {
              option: "f32";
            };
          },
          {
            name: "numForecasters";
            type: "u64";
          },
          {
            name: "numEstimateUpdates";
            type: "u64";
          },
          {
            name: "accumulatedWeights";
            type: "f32";
          },
          {
            name: "accumulatedWeightsSquared";
            type: "f32";
          },
          {
            name: "result";
            type: {
              option: "bool";
            };
          },
          {
            name: "question";
            type: "string";
          },
          {
            name: "description";
            type: "string";
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "scoringList";
      type: {
        kind: "struct";
        fields: [
          {
            name: "options";
            type: {
              array: ["f32", 128];
            };
          },
          {
            name: "cost";
            type: {
              array: ["f32", 128];
            };
          },
          {
            name: "peerScoreA";
            type: {
              array: ["f32", 128];
            };
          },
          {
            name: "peerScoreB";
            type: {
              array: ["f32", 128];
            };
          },
          {
            name: "lastSlot";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "userEstimateUpdate";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poll";
            type: "publicKey";
          },
          {
            name: "user";
            type: "publicKey";
          },
          {
            name: "slot";
            type: "u64";
          },
          {
            name: "timestamp";
            type: "i64";
          },
          {
            name: "lowerEstimate";
            type: "u16";
          },
          {
            name: "upperEstimate";
            type: "u16";
          }
        ];
      };
    },
    {
      name: "userEstimate";
      type: {
        kind: "struct";
        fields: [
          {
            name: "forecaster";
            type: "publicKey";
          },
          {
            name: "poll";
            type: "publicKey";
          },
          {
            name: "lowerEstimate";
            type: "u16";
          },
          {
            name: "upperEstimate";
            type: "u16";
          },
          {
            name: "scoreWeight";
            type: "f32";
          },
          {
            name: "recencyWeight";
            type: "f32";
          },
          {
            name: "numForecasters";
            type: "u64";
          },
          {
            name: "numEstimateUpdates";
            type: "u64";
          },
          {
            name: "options";
            type: {
              option: "f32";
            };
          },
          {
            name: "cost";
            type: {
              option: "f32";
            };
          },
          {
            name: "lnA";
            type: {
              option: "f32";
            };
          },
          {
            name: "lnB";
            type: {
              option: "f32";
            };
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "userScore";
      type: {
        kind: "struct";
        fields: [
          {
            name: "forecaster";
            type: "publicKey";
          },
          {
            name: "poll";
            type: "publicKey";
          },
          {
            name: "options";
            type: "f32";
          },
          {
            name: "lastLowerOption";
            type: "f32";
          },
          {
            name: "lastUpperOption";
            type: "f32";
          },
          {
            name: "cost";
            type: "f32";
          },
          {
            name: "lastLowerCost";
            type: "f32";
          },
          {
            name: "lastUpperCost";
            type: "f32";
          },
          {
            name: "lastPeerScore";
            type: "f32";
          },
          {
            name: "lnA";
            type: "f32";
          },
          {
            name: "lnB";
            type: "f32";
          },
          {
            name: "peerScoreA";
            type: "f32";
          },
          {
            name: "peerScoreB";
            type: "f32";
          },
          {
            name: "lastSlot";
            type: "u64";
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "user";
      type: {
        kind: "struct";
        fields: [
          {
            name: "score";
            type: "f32";
          },
          {
            name: "participationCount";
            type: "u32";
          },
          {
            name: "correctAnswersCount";
            type: "u32";
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "PollClosed";
      msg: "Poll is closed.";
    },
    {
      code: 6001;
      name: "PollNotResolved";
      msg: "Poll has not been resolved.";
    },
    {
      code: 6002;
      name: "PollAlreadyResolved";
      msg: "Poll has already been resolved.";
    }
  ];
};

export const IDL: Poe = {
  version: "0.1.0",
  name: "poe",
  instructions: [
    {
      name: "initialize",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "state",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "escrowAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "registerUser",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "user",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "createPoll",
      accounts: [
        {
          name: "creator",
          isMut: true,
          isSigner: true,
        },
        {
          name: "resolver",
          isMut: false,
          isSigner: false,
        },
        {
          name: "state",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poll",
          isMut: true,
          isSigner: false,
        },
        {
          name: "scoringList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "question",
          type: "string",
        },
        {
          name: "description",
          type: "string",
        },
        {
          name: "category",
          type: "u16",
        },
        {
          name: "decay",
          type: "f32",
        },
      ],
    },
    {
      name: "makeEstimate",
      accounts: [
        {
          name: "forecaster",
          isMut: true,
          isSigner: true,
        },
        {
          name: "user",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poll",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userEstimate",
          isMut: true,
          isSigner: false,
        },
        {
          name: "pollEstimateUpdate",
          isMut: true,
          isSigner: false,
        },
        {
          name: "scoringList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userScore",
          isMut: true,
          isSigner: false,
        },
        {
          name: "forecasterTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "escrowAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "lowerEstimate",
          type: "u16",
        },
        {
          name: "upperEstimate",
          type: "u16",
        },
      ],
    },
    {
      name: "updateEstimate",
      accounts: [
        {
          name: "forecaster",
          isMut: true,
          isSigner: true,
        },
        {
          name: "poll",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userEstimate",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userEstimateUpdate",
          isMut: true,
          isSigner: false,
        },
        {
          name: "estimateUpdate",
          isMut: true,
          isSigner: false,
        },
        {
          name: "scoringList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userScore",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "newLowerEstimate",
          type: "u16",
        },
        {
          name: "newUpperEstimate",
          type: "u16",
        },
      ],
    },
    {
      name: "removeEstimate",
      accounts: [
        {
          name: "forecaster",
          isMut: true,
          isSigner: true,
        },
        {
          name: "user",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poll",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userEstimate",
          isMut: true,
          isSigner: false,
        },
        {
          name: "estimateUpdate",
          isMut: true,
          isSigner: false,
        },
        {
          name: "scoringList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userScore",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "resolvePoll",
      accounts: [
        {
          name: "resolver",
          isMut: true,
          isSigner: true,
        },
        {
          name: "poll",
          isMut: true,
          isSigner: false,
        },
        {
          name: "scoringList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "result",
          type: "bool",
        },
      ],
    },
    {
      name: "collectPoints",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "forecaster",
          isMut: false,
          isSigner: false,
        },
        {
          name: "user",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poll",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userEstimate",
          isMut: true,
          isSigner: false,
        },
        {
          name: "scoringList",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userScore",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "forecasterTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "poeState",
      type: {
        kind: "struct",
        fields: [
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "numPolls",
            type: "u64",
          },
          {
            name: "score",
            type: "f32",
          },
          {
            name: "recalibrationFactor",
            type: "f32",
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "pollEstimateUpdate",
      type: {
        kind: "struct",
        fields: [
          {
            name: "poll",
            type: "publicKey",
          },
          {
            name: "slot",
            type: "u64",
          },
          {
            name: "timestamp",
            type: "i64",
          },
          {
            name: "estimate",
            type: {
              option: "u32",
            },
          },
          {
            name: "variance",
            type: {
              option: "f32",
            },
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "poll",
      type: {
        kind: "struct",
        fields: [
          {
            name: "creator",
            type: "publicKey",
          },
          {
            name: "resolver",
            type: "publicKey",
          },
          {
            name: "id",
            type: "u64",
          },
          {
            name: "category",
            type: "u16",
          },
          {
            name: "bettingAmount",
            type: "u64",
          },
          {
            name: "startSlot",
            type: "u64",
          },
          {
            name: "endSlot",
            type: {
              option: "u64",
            },
          },
          {
            name: "decayRate",
            type: "f32",
          },
          {
            name: "collectiveEstimate",
            type: {
              option: "u32",
            },
          },
          {
            name: "variance",
            type: {
              option: "f32",
            },
          },
          {
            name: "lnGm",
            type: {
              option: "f32",
            },
          },
          {
            name: "numForecasters",
            type: "u64",
          },
          {
            name: "numEstimateUpdates",
            type: "u64",
          },
          {
            name: "accumulatedWeights",
            type: "f32",
          },
          {
            name: "accumulatedWeightsSquared",
            type: "f32",
          },
          {
            name: "result",
            type: {
              option: "bool",
            },
          },
          {
            name: "question",
            type: "string",
          },
          {
            name: "description",
            type: "string",
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "scoringList",
      type: {
        kind: "struct",
        fields: [
          {
            name: "options",
            type: {
              array: ["f32", 128],
            },
          },
          {
            name: "cost",
            type: {
              array: ["f32", 128],
            },
          },
          {
            name: "peerScoreA",
            type: {
              array: ["f32", 128],
            },
          },
          {
            name: "peerScoreB",
            type: {
              array: ["f32", 128],
            },
          },
          {
            name: "lastSlot",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "userEstimateUpdate",
      type: {
        kind: "struct",
        fields: [
          {
            name: "poll",
            type: "publicKey",
          },
          {
            name: "user",
            type: "publicKey",
          },
          {
            name: "slot",
            type: "u64",
          },
          {
            name: "timestamp",
            type: "i64",
          },
          {
            name: "lowerEstimate",
            type: "u16",
          },
          {
            name: "upperEstimate",
            type: "u16",
          },
        ],
      },
    },
    {
      name: "userEstimate",
      type: {
        kind: "struct",
        fields: [
          {
            name: "forecaster",
            type: "publicKey",
          },
          {
            name: "poll",
            type: "publicKey",
          },
          {
            name: "lowerEstimate",
            type: "u16",
          },
          {
            name: "upperEstimate",
            type: "u16",
          },
          {
            name: "scoreWeight",
            type: "f32",
          },
          {
            name: "recencyWeight",
            type: "f32",
          },
          {
            name: "numForecasters",
            type: "u64",
          },
          {
            name: "numEstimateUpdates",
            type: "u64",
          },
          {
            name: "options",
            type: {
              option: "f32",
            },
          },
          {
            name: "cost",
            type: {
              option: "f32",
            },
          },
          {
            name: "lnA",
            type: {
              option: "f32",
            },
          },
          {
            name: "lnB",
            type: {
              option: "f32",
            },
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "userScore",
      type: {
        kind: "struct",
        fields: [
          {
            name: "forecaster",
            type: "publicKey",
          },
          {
            name: "poll",
            type: "publicKey",
          },
          {
            name: "options",
            type: "f32",
          },
          {
            name: "lastLowerOption",
            type: "f32",
          },
          {
            name: "lastUpperOption",
            type: "f32",
          },
          {
            name: "cost",
            type: "f32",
          },
          {
            name: "lastLowerCost",
            type: "f32",
          },
          {
            name: "lastUpperCost",
            type: "f32",
          },
          {
            name: "lastPeerScore",
            type: "f32",
          },
          {
            name: "lnA",
            type: "f32",
          },
          {
            name: "lnB",
            type: "f32",
          },
          {
            name: "peerScoreA",
            type: "f32",
          },
          {
            name: "peerScoreB",
            type: "f32",
          },
          {
            name: "lastSlot",
            type: "u64",
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "user",
      type: {
        kind: "struct",
        fields: [
          {
            name: "score",
            type: "f32",
          },
          {
            name: "participationCount",
            type: "u32",
          },
          {
            name: "correctAnswersCount",
            type: "u32",
          },
          {
            name: "bump",
            type: "u8",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "PollClosed",
      msg: "Poll is closed.",
    },
    {
      code: 6001,
      name: "PollNotResolved",
      msg: "Poll has not been resolved.",
    },
    {
      code: 6002,
      name: "PollAlreadyResolved",
      msg: "Poll has already been resolved.",
    },
  ],
};
