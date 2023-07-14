window.addEventListener("load", (e) => {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const points = document.getElementById("points");
  const canvasWidth = (canvas.width = 600);
  const canvasHeight = (canvas.height = 850);
  const levelbar = document.getElementById("levelbar");
  const reset = document.getElementById("reset");
  const powerupbar = document.getElementById("powerup");
  const abilitybar = document.getElementById("ability");
  let left = false;
  let right = false;
  let canShoot = true;
  let shooting = false;
  let currentItem = null;
  let extralife = false;
  let protectedRocket = false;
  let level = 5;
  let running = true;
  let shootingInterval = 0.4;
  let ufos = [];
  let shots = [];
  let items = [];
  let pointsmultiplier = 1;
  let score = 0;
  let ufoInterval;
  let powerups = ["shield", "extralife", "fastshooting", "pointsmultiplier"];

  class Background {
    constructor() {
      this.y = 0;
      this.speed = 1;
      this.backgroundImage = new Image();
      this.backgroundImage.src = "images/space.jpg";
      this.backgroundImage.height = canvasHeight;
    }

    update() {
      if (this.y >= this.backgroundImage.height) this.y = 0;
      this.y = this.y + this.speed;
    }

    draw() {
      ctx.drawImage(
        this.backgroundImage,
        0,
        this.y,
        this.backgroundImage.height,
        this.backgroundImage.height
      );
      ctx.drawImage(
        this.backgroundImage,
        0,
        this.y - this.backgroundImage.height,
        this.backgroundImage.width,
        this.backgroundImage.height
      );
    }
  }

  class Rocket {
    constructor() {
      this.image = new Image();
      this.image.src = "images/rocket.png";
      this.width = this.image.width / 3;
      this.height = this.image.height / 3;
      this.x = (canvasWidth - this.width) / 2;
      this.y = canvasHeight - this.height;
      this.speed = 3;
      this.image.onload = () => {
        this.width = this.image.width / 3;
        this.height = this.image.height / 3;
        this.x = (canvasWidth - this.width) / 2;
        this.y = canvasHeight - this.height;
        this.draw();
      };
    }

    draw() {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    moveLeft() {
      if (this.x > 0) {
        this.x -= this.speed;
      }
    }

    moveRight() {
      if (this.x < canvasWidth - this.width) {
        this.x += this.speed;
      }
    }
  }

  class Ufo {
    constructor() {
      this.image = new Image();
      this.image.src = "images/ufo.png";
      this.width = this.image.width / 4;
      this.height = this.image.height / 4;
      this.y = 0;
      this.x = Math.floor(Math.random() * (canvasWidth - this.width)) + 1;
      this.speed = Math.floor(Math.random() * 2) + 1;
      this.lives = Math.floor(Math.random() * 3) + 1;
      this.image.onload = () => {
        this.width = this.image.width / 4;
        this.height = this.image.height / 4;
        this.y = 0;
        this.x = Math.floor(Math.random() * (canvasWidth - this.width)) + 1;
        this.draw();
      };
    }

    draw() {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }

  const background = new Background();

  const rocket = new Rocket();

  spawnUfos();
  spawnItems();
  increaseDifficulty();

  class Shot {
    constructor() {
      this.width = 8;
      this.height = 50;
      this.x = rocket.x + rocket.width / 2 - this.width / 2;
      this.y = canvasHeight - rocket.height - this.height;
      shots.push(this);
      const audio = new Audio("sounds/shoot.mp3");
      audio.play();
    }
    shoot() {
      ctx.fillStyle = "red";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    checkCollision() {
      const shotHitbox = {
        left: this.x,
        top: this.y,
        right: this.x + this.width,
        bottom: this.y + this.height,
      };
      ufos.forEach((ufo, index) => {
        const ufoHitbox = {
          left: ufo.x,
          top: ufo.y,
          right: ufo.x + ufo.width,
          bottom: ufo.y + ufo.height,
        };

        let overlap = !(
          shotHitbox.right < ufoHitbox.left ||
          shotHitbox.left > ufoHitbox.right ||
          shotHitbox.bottom < ufoHitbox.top ||
          shotHitbox.top > ufoHitbox.bottom
        );

        if (overlap) {
          ufo.lives--;
          const audio = new Audio("sounds/kill.mp3");
          audio.play();
          if (ufo.lives == 0) {
            ufos.splice(index, 1);
            score += 10 * pointsmultiplier;
            points.innerText = "Points : " + score;
          }
          shots = shots.filter((s) => s !== this);
        }
      });
    }
  }

  class Item {
    constructor() {
      console.log("new Item spawned!");
      this.image = new Image();
      this.item = powerups[Math.floor(Math.random() * powerups.length)];
      switch (this.item) {
        case "shield":
          this.image.src = "images/shield.png";
          break;
        case "extralife":
          this.image.src = "images/extralife.png";
          break;
        case "fastshooting":
          this.image.src = "images/bullet.png";
          break;
        case "pointsmultiplier":
          this.image.src = "images/multiplier.png";
          break;
      }
      this.width = this.image.width / 7;
      this.height = this.image.height / 7;
      this.y = 0;
      this.x = Math.floor(Math.random() * (canvasWidth - this.width)) + 1;
      this.speed = Math.floor(Math.random() * 2) + 1;
      this.image.onload = () => {
        this.width = this.image.width / 7;
        this.height = this.image.height / 7;
        this.y = 0;
        this.x = Math.floor(Math.random() * (canvasWidth - this.width)) + 1;
        this.draw();
      };
    }
    draw() {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
    checkCollision() {
      const rocketHitbox = {
        left: rocket.x,
        top: rocket.y,
        right: rocket.x + rocket.width,
        bottom: rocket.y + rocket.height,
      };

      items.forEach((item) => {
        const itemHitbox = {
          left: item.x,
          top: item.y,
          right: item.x + item.width,
          bottom: item.y + item.height,
        };

        let overlap = !(
          itemHitbox.right < rocketHitbox.left ||
          itemHitbox.left > rocketHitbox.right ||
          itemHitbox.bottom < rocketHitbox.top ||
          itemHitbox.top > rocketHitbox.bottom
        );

        if (overlap) {
          const upgrade = new Audio("sounds/upgrade.mp3");
          upgrade.play();
          this.remove();
          this.execute();
        }
      });
    }

    execute() {
      abilityTime();
      switch (this.item) {
        case "shield":
          protectedRocket = true;
          powerupbar.innerText = "Powerup : Shield";
          let executer1 = setTimeout(() => {
            protectedRocket = false;
            powerupbar.innerText = "Powerup : Default";
            clearTimeout(executer1);
          }, 10000);
          break;
        case "extralife":
          extralife = true;
          powerupbar.innerText = "Powerup : Extralife";
          let executer2 = setTimeout(() => {
            extralife = false;
            powerupbar.innerText = "Powerup : Default";
            clearTimeout(executer2);
          }, 10000);
          break;
        case "fastshooting":
          shootingInterval = 0.2;
          powerupbar.innerText = "Powerup : Fastshooting";
          let executer3 = setTimeout(() => {
            shootingInterval = 0.4;
            powerupbar.innerText = "Powerup : Default";
            clearTimeout(executer3);
          }, 10000);
          break;
        case "pointsmultiplier":
          pointsmultiplier *= 2;
          powerupbar.innerText = "Powerup : 2x Points";
          let executer4 = setTimeout(() => {
            pointsmultiplier /= 2;
            powerupbar.innerText = "Powerup : Default";
            clearTimeout(executer4);
          }, 10000);
          break;
      }
    }

    remove() {
      items = items.filter((i) => i != this);
    }
  }

  function checkCollision() {
    const rocketHitbox = {
      left: rocket.x,
      top: rocket.y,
      right: rocket.x + rocket.width,
      bottom: rocket.y + rocket.height,
    };

    ufos.forEach((ufo, index) => {
      const ufoHitbox = {
        left: ufo.x,
        top: ufo.y,
        right: ufo.x + ufo.width,
        bottom: ufo.y + ufo.height,
      };

      let overlap = !(
        ufoHitbox.right < rocketHitbox.left ||
        ufoHitbox.left > rocketHitbox.right ||
        ufoHitbox.bottom < rocketHitbox.top ||
        ufoHitbox.top > rocketHitbox.bottom
      );

      if (overlap && !protectedRocket) {
        if (extralife) {
          ufos.splice(index, 1);
          extralife = false;
          powerupbar.innerText = "Powerup : Default";
        } else {
          running = false;
        }
      }
    });
  }

  function spawnItems() {
    setInterval(function () {
      if (running) {
        items.push(new Item());
      }
    }, 20000);
  }

  function spawnUfos() {
    if (ufoInterval != null) {
      clearInterval(ufoInterval);
    }
    ufoInterval = setInterval(function () {
      if (running) {
        ufos.push(new Ufo());
      }
    }, level * 1500);
  }

  function levelupAnimation() {
    levelbar.style.display = "flex";
    setTimeout(function () {
      levelbar.style.display = "none";
    }, 3000);
  }

  function increaseDifficulty() {
    let interval = setInterval(function () {
      levelupAnimation();
      levelup = new Audio("sounds/levelup.mp3");
      levelup.play();
      level--;
      spawnUfos();
      background.speed += 0.2;

      if (level == 1) {
        clearInterval(interval);
      }

      if (!running) {
        clearInterval(interval);
      }
    }, 30000);
  }

  function manageShots() {
    shots.forEach((shot, index) => {
      shot.y -= 2;
      if (shot.y < 0) {
        shots.splice(index, 1);
      }
      shot.checkCollision();
    });
  }

  function manageUfos() {
    ufos.forEach((ufo, index) => {
      ufo.y += ufo.speed;
      if (ufo.y > canvasHeight) {
        ufos.splice(index, 1);
      }
    });
  }

  function manageItems() {
    items.forEach((item, index) => {
      item.y += item.speed;
      if (item.y > canvasHeight) {
        items.splice(index, 1);
      }
      item.checkCollision();
    });
  }

  function abilityTime() {
    let s = 10;
    abilitybar.innerText = "Ability : " + s;
    x = setInterval(function () {
      s--;
      abilitybar.innerText = "Ability : " + s;
      if (s == 0) {
        clearInterval(x);
      }
    }, 1000);
  }

  function gameloop() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    background.update();
    background.draw();
    manageUfos();
    manageShots();
    manageItems();
    checkCollision();
    checkShooting();

    shots.forEach((shot) => {
      shot.shoot();
    });

    items.forEach((item) => {
      item.draw();
    });

    ufos.forEach((ufo) => {
      ufo.draw();
    });
    rocket.draw();
    if (left) {
      rocket.moveLeft();
    }
    if (right) {
      rocket.moveRight();
    }

    if (running) {
      requestAnimationFrame(gameloop);
    } else {
      alert("Your Score: " + score);
    }
  }

  function checkShooting() {
    if (shooting && canShoot) {
      new Shot();
      canShoot = false;
      setTimeout(function () {
        canShoot = true;
        clearTimeout(this);
      }, 1000 * shootingInterval);
    }
  }

  function check() {
    document.onkeydown = function (e) {
      const key = e.key;
      switch (key) {
        case "ArrowLeft":
          left = true;
          break;
        case "ArrowRight":
          right = true;
          break;
        case "ArrowUp":
          shooting = true;
          break;
      }
    };

    document.onkeyup = function (e) {
      const key = e.key;
      switch (key) {
        case "ArrowLeft":
          left = false;
          break;
        case "ArrowRight":
          right = false;
          break;
        case "ArrowUp":
          shooting = false;
          break;
      }
    };

    requestAnimationFrame(check);
  }

  let resetGame = () => {
    location.reload();
  };

  reset.addEventListener("click", resetGame);

  check();

  gameloop();
});
