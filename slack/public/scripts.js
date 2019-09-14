const username = prompt("What is your username?");

const socket = io("http://localhost:9000", {
  query: {
    username
  }
});
let nsSocket = "";

socket.on("nsList", nsData => {
  console.log("The list of namespaces has arrived.");

  let namespacesDiv = document.querySelector(".namespaces");
  namespacesDiv.innerHTML = "";
  nsData.forEach(ns => {
    namespacesDiv.innerHTML += `<div ns=${ns.endpoint} class="namespace"><img src=${ns.img} /></div>`;
  });

  Array.from(document.getElementsByClassName("namespace")).forEach(el => {
    el.addEventListener("click", event => {
      const nsEndpoint = el.getAttribute("ns");
      joinNs(nsEndpoint);
    });
  });

  joinNs("/wiki");
});
