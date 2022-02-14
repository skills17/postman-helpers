type NewmanItem = {
  id: string;
  name: string;
  item?: NewmanItem[];
};

type NewmanReport = {
  collection: {
    item: NewmanItem[];
    info: {
      name: string;
    };
  };
  run: {
    executions: {
      item: {
        id: string;
        name: string;
      };
      assertions: {
        assertion: string;
        skipped: boolean;
        error?: {
          name: string;
        };
      }[];
    }[];
  };
};
