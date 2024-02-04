const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const { keccak256 } = require("ethereum-cryptography/keccak");
const { utf8ToBytes, toHex } = require("ethereum-cryptography/utils");
const secp = require("ethereum-cryptography/secp256k1");

app.use(cors());
app.use(express.json());

const balances = {
  "035baac886cdca9e5f64066b181cbaf396cd51940ea1b95ffbb3dff31e3d64ed72": 200,
  "034ff300f6dd3fd239a9db59b3db4a049821fd0920bdc5bc34aaaf519d16fb3bcf": 50,
  "033361fff31b289502f103a8c552fc2e9cb15325df8a9059c69b01b0a2aebb6d3b": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, recipient, amount, signature} = req.body;
  const messageHash = hashMessage(sender, recipient, amount);
  if (!secp.secp256k1.verify(signature, messageHash, sender)) {
    res.status(400).send({ message: "Operation failed!" });
    return;
  }

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}

function hashMessage(sender, recipient, amount) {
  const message = "sender:" + sender + "amount:" + parseInt(amount) + "recipient:" + recipient;
  const bytes = utf8ToBytes(message);
  return keccak256(bytes);
}