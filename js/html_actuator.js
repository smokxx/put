var legendLinks = {
  2: 'http://lurkmore.to/%D0%92%D0%B0%D1%82%D0%BD%D0%B8%D0%BA',
  4: 'http://lurkmore.to/%D0%9A%D0%B0%D0%B7%D0%B0%D1%87%D0%B5%D1%81%D1%82%D0%B2%D0%BE#.D0.92_.D0.BD.D0.B0.D1.88.D0.B5_.D0.B2.D1.80.D0.B5.D0.BC.D1.8F',
  8: 'http://lurkmore.to/%D0%92%D0%B8%D1%82%D0%B0%D0%BB%D0%B8%D0%B9_%D0%9C%D0%B8%D0%BB%D0%BE%D0%BD%D0%BE%D0%B2',
  16: 'http://lurkmore.to/%D0%9C%D0%B8%D0%B7%D1%83%D0%BB%D0%B8%D0%BD%D0%B0',
  32: 'http://lurkmore.to/%D0%9F%D0%B5%D1%85%D1%82%D0%B8%D0%BD%D0%B3',
  64: 'http://lurkmore.to/%D0%AF%D0%BA%D1%83%D0%BD%D0%B8%D0%BD#.D0.AF.D0.BA.D1.83.D0.BD.D0.B8.D0.BD',
  128: 'http://lurkmore.to/%D0%9A%D0%B8%D1%81%D0%B5%D0%BB%D0%B5%D0%B2',
  256: 'http://navalny.livejournal.com/822868.html',
  512: 'http://lurkmore.to/%D0%9F%D0%B5%D1%82%D0%B5%D1%80%D0%B1%D1%83%D1%80%D0%B3#.D0.9C.D0.B0.D1.82.D0.B2.D0.B8.D0.B5.D0.BD.D0.BA.D0.BE',
  1024: 'http://lurkmore.to/%D0%9C%D0%B5%D0%B4%D0%B2%D0%B5%D0%B4%D0%B5%D0%B2',
  2048: 'http://lurkmore.to/%D0%9F%D1%83%D1%82%D0%B8%D0%BD',
  4096: 'http://lurkmore.to/%D0%A1%D1%82%D0%B0%D0%BB%D0%B8%D0%BD',
  8192: 'http://www.youtube.com/watch?v=aA_8iWIpO1A'
};

var MAX_VALUE = 8192;

function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.sharingContainer = document.querySelector(".score-sharing");

  this.score = 0;
  this.legend = document.querySelector(".legend");
  this.resetLegend();
}

HTMLActuator.prototype.resetLegend = function () {
  this.tileRevealed = 1;
  this.legendTileWhat = document.createElement('div');
  this.legendTileWhat.setAttribute('class', 'legend-tile legend-tile-what');
  this.legendTileWhat.innerHTML = '?';
  this.legend.innerHTML = '';
  this.legend.appendChild(this.legendTileWhat);
  this.revealLegend(4);
};

HTMLActuator.prototype.revealLegend = function (value) {
  if (this.tileRevealed >= value || value > MAX_VALUE) {
   return;
  }
  for (var i = this.tileRevealed * 2; i <= value; i *= 2) {
    var legendLink = document.createElement('a');
    legendLink.href = legendLinks[i];
    var legendTile = document.createElement('div');
    legendLink.appendChild(legendTile);
    legendTile.setAttribute('class', 'legend-tile legend-tile-' + i);
    this.legend.insertBefore(legendLink, this.legendTileWhat);
    var arrow = document.createElement('div');
    if (i < MAX_VALUE) {
      arrow.setAttribute('class', 'arrow-right');
      this.legend.insertBefore(arrow, this.legendTileWhat);
    }
  }
  if (value == MAX_VALUE && this.legendTileWhat) {
    this.legend.removeChild(this.legendTileWhat);
    this.legendTileWhat = null;
  }
  this.tileRevealed = value;
};

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }

  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "restart");
  }

  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We cannot use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];
  this.revealLegend(tile.value);

  if (tile.value > MAX_VALUE) {
    inner.textContent = tile.value;
    classes.push("tile-super");
  }

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "Победа!" : "Провал! :(";

  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "end", type, this.score);
  }

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;

  this.clearContainer(this.sharingContainer);
  this.sharingContainer.appendChild(this.scoreTweetButton());
  twttr.widgets.load();
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.scoreTweetButton = function () {
  var tweet = document.createElement("a");
  tweet.classList.add("twitter-share-button");
  tweet.setAttribute("href", "https://twitter.com/share");
  tweet.setAttribute("data-via", "gabrielecirulli");
  tweet.setAttribute("data-url", "http://git.io/2048");
  tweet.setAttribute("data-counturl", "http://gabrielecirulli.github.io/2048/");
  tweet.textContent = "Tweet";

  var text = "I scored " + this.score + " points at 2048, a game where you " +
             "join numbers to score high! #2048game";
  tweet.setAttribute("data-text", text);

  return tweet;
};
