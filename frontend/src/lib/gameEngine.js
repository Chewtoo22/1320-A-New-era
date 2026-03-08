const QUARTER_MILE = 1320;

export class RaceEngine {
  constructor(playerCar, opponentData) {
    this.playerBaseET = playerCar.effective_stats.effectiveET;
    this.playerBaseTrap = playerCar.effective_stats.effectiveSpeed;
    this.playerGears = playerCar.catalog.gears;
    this.playerRedline = playerCar.catalog.redline || 7000;
    this.isElectric = playerCar.catalog.gears === 1;

    this.opponentET = opponentData.et + (Math.random() * 0.3 - 0.15);
    this.opponentTrap = opponentData.trap;
    this.opponentGears = 6;
    this.opponentRedline = 7000;

    this.state = 'idle';
    this.raceTime = 0;
    this.greenLightTime = 0;
    this.countdownStep = 0;

    this.player = {
      rpm: 800, gear: 1, speed: 0, distance: 0,
      launched: false, finished: false,
      reactionTime: 0, shiftPenalty: 0,
      finalET: 0, trapSpeed: 0, shiftCount: 0,
      shiftQualities: []
    };

    this.opponent = {
      rpm: 800, gear: 1, speed: 0, distance: 0,
      launched: false, finished: false,
      reactionTime: 0.15 + Math.random() * 0.2,
      finalET: 0, trapSpeed: 0,
      nextShiftRPM: 0.85 + Math.random() * 0.1
    };

    this.winner = null;
    this.raceStartTime = 0;
    this.opponentLaunchTime = 0;
    this.opponentRaceTime = 0;
  }

  startCountdown() {
    this.state = 'countdown';
    this.countdownStep = 0;
  }

  advanceCountdown() {
    this.countdownStep++;
    if (this.countdownStep >= 4) {
      this.state = 'green';
      this.greenLightTime = performance.now();
      this.opponentLaunchTime = this.greenLightTime + this.opponent.reactionTime * 1000;
    }
  }

  playerLaunch(launchTime) {
    if (this.state === 'countdown') return 'foul';
    if (this.state !== 'green' && this.state !== 'racing') return null;
    if (this.player.launched) return null;

    const reaction = (launchTime - this.greenLightTime) / 1000;
    if (reaction < 0) return 'foul';

    this.player.reactionTime = Math.max(reaction, 0);
    this.player.launched = true;
    this.state = 'racing';
    this.raceStartTime = launchTime;
    return reaction;
  }

  playerShift() {
    if (!this.player.launched || this.player.finished) return null;
    if (this.isElectric) return null;
    if (this.player.gear >= this.playerGears) return null;

    const rpmPct = this.player.rpm / this.playerRedline;
    let quality;

    if (rpmPct >= 0.82 && rpmPct <= 0.93) {
      quality = 'perfect';
    } else if (rpmPct >= 0.72 && rpmPct <= 0.96) {
      quality = 'good';
      this.player.shiftPenalty += 0.06;
    } else if (rpmPct >= 0.55) {
      quality = 'early';
      this.player.shiftPenalty += 0.18;
    } else {
      quality = 'bad';
      this.player.shiftPenalty += 0.35;
    }

    this.player.gear++;
    this.player.rpm = this.player.rpm * 0.52;
    this.player.shiftCount++;
    this.player.shiftQualities.push(quality);
    return quality;
  }

  update(now) {
    if (this.state !== 'racing' && this.state !== 'green') return;

    if (this.state === 'green' && !this.player.launched) {
      if (now >= this.opponentLaunchTime) {
        this.opponent.launched = true;
      }
      this._updateOpponent(now);
      return;
    }

    if (this.player.launched && !this.player.finished) {
      const elapsed = (now - this.raceStartTime) / 1000;
      this.raceTime = elapsed;
      this._updatePlayer(elapsed);
    }

    this._updateOpponent(now);

    if (this.player.finished && this.opponent.finished && !this.winner) {
      this.winner = this.player.finalET <= this.opponent.finalET ? 'player' : 'opponent';
    }
  }

  _updatePlayer(elapsed) {
    const targetET = this.playerBaseET + this.player.reactionTime + this.player.shiftPenalty;
    const raceElapsed = elapsed - this.player.reactionTime;
    if (raceElapsed <= 0) return;

    const progress = Math.min(raceElapsed / (targetET - this.player.reactionTime), 1);
    const distance = QUARTER_MILE * Math.pow(progress, 1.75);
    const prevDist = this.player.distance;
    this.player.distance = distance;

    const dt = 1 / 60;
    if (dt > 0 && distance > prevDist) {
      this.player.speed = ((distance - prevDist) / dt) / 1.467;
    }
    this.player.speed = Math.min(this.player.speed, this.playerBaseTrap * 1.1);

    if (!this.isElectric) {
      const gearTime = (targetET - this.player.reactionTime) / this.playerGears;
      const gearElapsed = raceElapsed % Math.max(gearTime, 0.5);
      const rpmProgress = gearElapsed / Math.max(gearTime, 0.5);
      const targetRPM = 800 + (this.playerRedline - 800) * Math.min(rpmProgress * 1.2, 1);
      this.player.rpm = Math.min(targetRPM, this.playerRedline);
    }

    if (this.player.distance >= QUARTER_MILE) {
      this.player.finished = true;
      this.player.finalET = parseFloat(targetET.toFixed(3));
      this.player.trapSpeed = parseFloat(this.playerBaseTrap.toFixed(1));
      this.player.distance = QUARTER_MILE;
    }
  }

  _updateOpponent(now) {
    if (!this.opponent.launched) {
      if (now >= this.opponentLaunchTime) {
        this.opponent.launched = true;
      }
      return;
    }

    if (this.opponent.finished) return;

    const opElapsed = (now - this.opponentLaunchTime) / 1000;
    if (opElapsed <= 0) return;

    const opTargetET = this.opponentET;
    const progress = Math.min(opElapsed / opTargetET, 1);
    const distance = QUARTER_MILE * Math.pow(progress, 1.75);
    const prevDist = this.opponent.distance;
    this.opponent.distance = distance;

    const dt = 1 / 60;
    if (dt > 0 && distance > prevDist) {
      this.opponent.speed = ((distance - prevDist) / dt) / 1.467;
    }
    this.opponent.speed = Math.min(this.opponent.speed, this.opponentTrap * 1.1);

    const gearTime = opTargetET / this.opponentGears;
    const gearElapsed = opElapsed % Math.max(gearTime, 0.5);
    const rpmProgress = gearElapsed / Math.max(gearTime, 0.5);
    this.opponent.rpm = Math.min(800 + (this.opponentRedline - 800) * rpmProgress * 1.2, this.opponentRedline);

    if (this.opponent.rpm / this.opponentRedline > this.opponent.nextShiftRPM) {
      this.opponent.gear = Math.min(this.opponent.gear + 1, this.opponentGears);
      this.opponent.rpm = this.opponent.rpm * 0.52;
      this.opponent.nextShiftRPM = 0.83 + Math.random() * 0.12;
    }

    if (this.opponent.distance >= QUARTER_MILE) {
      this.opponent.finished = true;
      this.opponent.finalET = parseFloat(opTargetET.toFixed(3));
      this.opponent.trapSpeed = parseFloat(this.opponentTrap.toFixed(1));
      this.opponent.distance = QUARTER_MILE;
    }
  }

  isFinished() {
    return this.player.finished && this.opponent.finished;
  }

  getResults() {
    return {
      playerET: this.player.finalET,
      playerSpeed: this.player.trapSpeed,
      playerReaction: parseFloat(this.player.reactionTime.toFixed(3)),
      opponentET: this.opponent.finalET,
      opponentSpeed: this.opponent.trapSpeed,
      opponentReaction: parseFloat(this.opponent.reactionTime.toFixed(3)),
      winner: this.winner,
      shiftQualities: this.player.shiftQualities,
      shiftPenalty: parseFloat(this.player.shiftPenalty.toFixed(3)),
    };
  }
}

export function drawRaceScene(ctx, width, height, engine, playerColor, opponentColor) {
  ctx.clearRect(0, 0, width, height);

  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.35);
  skyGrad.addColorStop(0, '#050510');
  skyGrad.addColorStop(1, '#0e0e1e');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height * 0.35);

  for (let i = 0; i < 40; i++) {
    const sx = (i * 37 + 13) % width;
    const sy = (i * 23 + 7) % (height * 0.3);
    const brightness = 0.3 + Math.random() * 0.4;
    ctx.fillStyle = `rgba(255,255,255,${brightness})`;
    ctx.fillRect(sx, sy, 1, 1);
  }

  const buildingY = height * 0.2;
  ctx.fillStyle = '#0a0a14';
  for (let i = 0; i < 15; i++) {
    const bx = i * (width / 12) - 20;
    const bw = 40 + (i % 3) * 20;
    const bh = 30 + (i % 5) * 25;
    ctx.fillRect(bx, buildingY + (height * 0.15 - bh), bw, bh);
    ctx.fillStyle = '#0d0d18';
    for (let wy = 0; wy < bh - 5; wy += 8) {
      for (let wx = 4; wx < bw - 4; wx += 10) {
        if (Math.random() > 0.6) {
          ctx.fillStyle = 'rgba(255,200,50,0.15)';
          ctx.fillRect(bx + wx, buildingY + (height * 0.15 - bh) + wy, 4, 4);
        }
      }
    }
    ctx.fillStyle = '#0a0a14';
  }

  ctx.fillStyle = '#181820';
  ctx.fillRect(0, height * 0.35, width, height * 0.65);

  const maxDist = Math.max(engine.player.distance, engine.opponent.distance, 100);
  const pxPerFoot = width * 0.6 / Math.max(maxDist, QUARTER_MILE * 0.3);
  const cameraX = Math.max(0, (engine.player.distance + engine.opponent.distance) / 2 * pxPerFoot - width * 0.35);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.setLineDash([40, 25]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.57);
  ctx.lineTo(width, height * 0.57);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.38);
  ctx.lineTo(width, height * 0.38);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, height * 0.76);
  ctx.lineTo(width, height * 0.76);
  ctx.stroke();

  const finishX = QUARTER_MILE * pxPerFoot - cameraX;
  if (finishX > 0 && finishX < width + 50) {
    const sz = 8;
    for (let row = 0; row < Math.floor(height * 0.42 / sz); row++) {
      for (let col = 0; col < 3; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(finishX + col * sz, height * 0.36 + row * sz, sz, sz);
      }
    }
  }

  const playerX = engine.player.distance * pxPerFoot - cameraX;
  const opponentX = engine.opponent.distance * pxPerFoot - cameraX;

  drawCar(ctx, playerX, height * 0.42, 90, 32, playerColor);
  drawCar(ctx, opponentX, height * 0.62, 90, 32, opponentColor);

  if (engine.player.speed > 30) {
    const intensity = Math.min((engine.player.speed - 30) / 100, 0.4);
    ctx.strokeStyle = `rgba(255,255,255,${intensity * 0.3})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const ly = height * 0.42 + 5 + i * 6;
      const lx = playerX - 10 - Math.random() * 40;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx - 20 - Math.random() * 30, ly);
      ctx.stroke();
    }
  }
}

function drawCar(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.45);
  ctx.lineTo(x + w * 0.05, y + h * 0.35);
  ctx.lineTo(x + w * 0.15, y + h * 0.15);
  ctx.lineTo(x + w * 0.28, y);
  ctx.lineTo(x + w * 0.65, y);
  ctx.lineTo(x + w * 0.78, y + h * 0.15);
  ctx.lineTo(x + w * 0.92, y + h * 0.25);
  ctx.lineTo(x + w, y + h * 0.4);
  ctx.lineTo(x + w, y + h * 0.65);
  ctx.lineTo(x, y + h * 0.65);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(100,180,255,0.2)';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y + h * 0.05);
  ctx.lineTo(x + w * 0.63, y + h * 0.05);
  ctx.lineTo(x + w * 0.72, y + h * 0.18);
  ctx.lineTo(x + w * 0.22, y + h * 0.18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.arc(x + w * 0.2, y + h * 0.72, h * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.78, y + h * 0.72, h * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(x + w * 0.2, y + h * 0.72, h * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.78, y + h * 0.72, h * 0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff3300';
  ctx.fillRect(x + w * 0.97, y + h * 0.35, 3, h * 0.15);
  ctx.fillRect(x + w * 0.97, y + h * 0.52, 3, h * 0.1);

  ctx.fillStyle = '#ffff88';
  ctx.beginPath();
  ctx.arc(x + w * 0.02, y + h * 0.4, 3, 0, Math.PI * 2);
  ctx.fill();
}
