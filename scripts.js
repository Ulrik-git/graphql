const limit = 50;
let offset = 0;
let allTransactions = [];
let previousLength = 0;
let counter = 0;

function fetchTransactions(id) {
fetch("https://zone01normandie.org/api/graphql-engine/v1/graphql", {
    body: JSON.stringify({
    query: `{
        transaction(where: { userId: { _eq: ` + id + ` } }, limit: ${limit}, offset: ${offset}) {
        type amount objectId userId createdAt path
        }
    }`
    }),
    headers: {
    "Content-Type": "application/json"
    },
    method: "POST"
})
.then((response) => response.json())
.then((json) => {
    const transactions = json.data.transaction;
    
// Remove duplicates based on objectId and keep the one with highest amount,
    // except for transactions with the same path and objectId where the path
    // contains the word "checkpoint"
    
    allTransactions = [...allTransactions, ...Object.values(transactions)];
    offset += limit;
    if (allTransactions.length != previousLength) {
    previousLength = allTransactions.length;
    // There may be more transactions to fetch, so we call fetchTransactions again
    fetchTransactions(id);
    } else {
    // All transactions have been fetched
    
    // Remove duplicates based on path and keep the one with highest amount,
    // except for transactions with the same path where the path contains the word "checkpoint"
    
    const xpByPath = {}; // Create an empty object to track the highest XP value for each path
    let xpByPath2 = {}
    let totalXp = allTransactions.reduce((acc, { type, amount, path }) => {
      if ((path === "/rouen/div-01/piscine-js" || path == "/rouen/div-01/fs" || (!path.includes("piscine-js") && !path.includes("piscine-go") && type == "xp"))) {
        if (!xpByPath[path] && !path.includes("checkpoint") || amount > xpByPath[path]) {
          xpByPath[path] = amount; // Update the highest XP value for this path
        } else if (path.includes("checkpoint") && type == 'xp') {
            if (!xpByPath2[path]) {
                path = path+counter;
                xpByPath2[path] = amount;
            }
        }
        counter++;
        //console.log(type, amount, path, counter, xpByPath2)
        return acc + amount; // Always add the current XP value to the total XP
      } else {
        return acc; // Ignore non-XP transactions
      }
    }, 0);
    
    // Loop through xpByPath and add the highest XP value for each path to the total XP
    totalXp = 0
    for (const path in xpByPath) {
      totalXp += xpByPath[path];
    }
    for (const path in xpByPath2) {
        totalXp += xpByPath2[path];
      }
    
    console.log(xpByPath); // Log the highest XP value for each path
    console.log(formattedNumberXp(totalXp)); // Log the updated total XP value
    

    let levels = {};
    let levelsJS = {};
    let levelsGO = {};
    let levelsGlobal = {};
    
    const levelsFind = allTransactions.reduce((acc, { type, amount, path, userId, createdAt }) => {
      if (type === "level") {
        if (path.includes("piscine-js")) {
          levelsJS[path] = { amount, date: createdAt };
        } else if (path.includes("piscine-go")) {
          levelsGO[path] = { amount, date: createdAt };
        } else if (!path.includes("piscine-js") && !path.includes("piscine-go")) {
          levelsGlobal[path] = { amount, date: createdAt };
        }
        levels[path] = { amount, date: createdAt };
        counter++;
    
        return acc + amount;
      } else {
        return acc;
      }
    }, 0);
    
// Sort levels by line number
levelsJS = sortObjectByLineNumber(levelsJS);
levelsGO = sortObjectByLineNumber(levelsGO);
levelsGlobal = sortObjectByLineNumber(levelsGlobal);
let levelGlobal = Object.values(levelsGlobal)[Object.keys(levelsGlobal).length - 1];

const graphWidth = 2000;
const graphHeight = 400;
const barWidth = 20;
const transactions = Object.values(levelsGlobal);
transactions.sort((a, b) => a.amount - b.amount);
const maxAmount = Math.max(...transactions.map(t => t.amount));
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('width', graphWidth);
svg.setAttribute('height', graphHeight);
svg.setAttribute('viewBox', `0 0 ${graphWidth} ${graphHeight}`);

// Add level title
const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
title.setAttribute('x', graphWidth / 2);
title.setAttribute('y', 50);
title.setAttribute('text-anchor', 'middle');
title.setAttribute('font-size', '24');
title.textContent = `Levels Graph`;
svg.appendChild(title);

transactions.forEach((t, i) => {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', i * (barWidth + 10) + 10);
  rect.setAttribute('y', graphHeight - (t.amount / maxAmount) * (graphHeight - 50));
  rect.setAttribute('width', barWidth);
  rect.setAttribute('height', (t.amount / maxAmount) * (graphHeight - 50));
  rect.setAttribute('fill', 'blue');

  // Add date label
  const dateLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  dateLabel.setAttribute('x', i * (barWidth + 10) - 40);
  dateLabel.setAttribute('y', graphHeight + 40); // move label down
  dateLabel.setAttribute('font-size', '12'); // increase font size
  dateLabel.setAttribute('transform', `rotate(-45 ${i * (barWidth + 10) + 20},${graphHeight - 5})`);
  dateLabel.textContent = new Date(t.date).toLocaleDateString();
  svg.appendChild(dateLabel);

  const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'title');
  tooltip.textContent = `Amount: ${t.amount}, Date: ${t.date}`;
  rect.appendChild(tooltip);
  svg.appendChild(rect);
});

const graphContainer = document.getElementById('graph-container');
graphContainer.appendChild(svg);


    console.log("levels", levelsJS, levelsGO, levelsGlobal, Object.keys(levelsGlobal)[Object.keys(levelsGlobal).length - 1], Object.values(levelsGlobal)[Object.keys(levelsGlobal).length - 1])
    const totalXpUp = allTransactions.reduce((acc, { type, amount, path, userId }) => {
        if (type === "up" && !path.includes("piscine-js") && !path.includes("piscine-go")) {
            counter++;
            //console.log(path, type, amount, acc+amount, counter, userId)
        return acc + amount;
        } else {
        return acc;
        }
    }, 0);
    const totalXpDown = allTransactions.reduce((acc, { type, amount, path }) => {
        if (type === "down" && !path.includes("piscine-js") && !path.includes("piscine-go")) {
            counter++;
            //console.log(path, type, amount, acc+amount, counter)
            return acc + amount;
        } else {
            return acc;
        }
    }, 0);
    console.log(totalXp)
    let resultReceived = formattedNumber(totalXpDown);
    let resultDone = formattedNumber(totalXpUp);
    let resultRatio = Math.round((totalXpUp / totalXpDown) * 10) / 10;
    console.log("Up :", resultDone)
    console.log("Down :", resultReceived)
    console.log("Ratio :", resultRatio)
    document.getElementById('ratioDone').textContent = resultDone;
    document.getElementById('ratioReceived').textContent = resultReceived;
    document.getElementById('ratioTotal').textContent = "Ratio : " + resultRatio;
    if (resultDone < resultReceived) {
        document.getElementById('lineDone').setAttribute('y1', 200 - ((totalXpUp * 100) / totalXpDown * 2));
        console.log(totalXpDown, totalXpUp, (totalXpUp * 100) / totalXpDown * 2)
    } else {
        document.getElementById('lineReceived').setAttribute('y1', ((totalXpUp * 100) / totalXpDown * 2) - 200);
    }
    document.getElementById('xp').textContent = "XP : " + formattedNumber(totalXp);
    document.getElementById('level').textContent = "Level : " + maxAmount;
    }
})
.catch((error) => {
    console.error('Error fetching query:', error);
});
}

const formattedNumber = (num) => {
  if (num < 1000000) {
    return formattedNumberXp(num);
  }
  const suffixes = ["B", "kB", "MB", "GB", "TB"]; // suffixes for thousands, millions, billions, trillions, etc.
  const suffixIndex = Math.floor(Math.log(num) / Math.log(1000)); // determine the suffix index based on the value of the number
  const suffix = suffixes[suffixIndex]; // get the appropriate suffix from the suffixes array
  const roundedNum = (num / Math.pow(1000, suffixIndex)).toFixed(2); // divide the number by the appropriate power of 1000 and round to 2 decimal places
  return `${roundedNum}${suffix}`; // return the formatted number with suffix
};
  
  const formattedNumberXp = (num) => {
    const suffixes = ["B", "kB", "MB", "BB", "TB"]; // suffixes for thousands, millions, billions, trillions, etc.
    const digits = Math.floor(Math.log10(num)); // number of digits in the number
    const suffixIndex = Math.floor(digits / 3); // determine the suffix index based on the number of digits
    const suffix = suffixes[suffixIndex]; // get the appropriate suffix from the suffixes array
    const roundedNum = Math.ceil(num / Math.pow(1000, suffixIndex)).toFixed(0); // divide the number by the appropriate power of 1000 and round up to nearest integer
    return `${roundedNum}${suffix}`; // return the formatted number with suffix
  };
  
  let allUsers = [];
  let previousLengthBis = 0;

function fetchUsers(offset = 0) {
  fetch("https://zone01normandie.org/api/graphql-engine/v1/graphql", {
    body: JSON.stringify({
    query: `{
        user(limit: 50, offset: ${offset}) { id login }
    }`
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    method: "POST"
  })
  .then((response) => response.json())
  .then((json) => {
    const users = json.data.user;

    allUsers = [...allUsers, ...users];
    if (allUsers.length != previousLengthBis) {
        previousLengthBis = allUsers.length;
        // There may be more transactions to fetch, so we call fetchTransactions again
        console.log(allUsers)
        fetchUsers(offset + 20);
    } else {
      //console.log("All users fetched:", allUsers[0]);
      document.getElementById('bodyMain').style.display = 'block';
      document.getElementById('loader').style.display = 'none';
    }
  })
  .catch((error) => {
    console.error("Error fetching users:", error);
  });
}

let allProgress = [];
let previousLength2 = 0;

function fetchProgress(offset = 0) {
  fetch("https://zone01normandie.org/api/graphql-engine/v1/graphql", {
    body: JSON.stringify({
      query: `
        {
          progress(limit: 20, offset: ${offset}) {
            userId
            user {
              id
              login
            }
          }
        }
      `
    }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  })
    .then((response) => response.json())
    .then((json) => {
      const progress = json.data.progress;
  
      allProgress = [...allProgress, ...progress];
      if (allProgress.length != previousLength2) {
          previousLength2 = allProgress.length;
        // There may be more progress to fetch, so we call fetchProgress again
        fetchProgress(offset + 20);
        //console.log("All progress fetched:", allProgress);
      } else {
        console.log("All progress fetched:", allProgress);
        alert('All progress fetched')
      }
    })
    .catch((error) => {
      console.error("Error fetching progress:", error);
    });
}


fetchUsers();

function searchLogin() {
    const searchValue = document.getElementById("login-input").value.trim(); // Trim whitespace from input value
    const resultElement = document.getElementById("result");
    const foundObject = allUsers.find(obj => 
      obj.login.toLowerCase() === searchValue.toLowerCase() || // Check if login value matches search value
      obj.id === parseInt(searchValue) // Check if ID value matches search value
    );
    if (foundObject) {
      resultElement.textContent = `Found object with ID: ${foundObject.id} and login: ${foundObject.login}`;
      fetchTransactions(foundObject.id);
      fetchProgress();
      document.getElementById('username').textContent = "Welcome " + foundObject.login;
    } else {
      resultElement.textContent = "No matching object found";
    }
  }

function sortObjectByLineNumber(obj) {
    const newObj = {};
    Object.keys(obj)
      .sort((a, b) => obj[a] - obj[b])
      .forEach((key) => {
        newObj[key] = obj[key];
      });
    return newObj;
  }
  