const QUARTER_MILE = 1320;

// Gear ratio sets by gear count
const RATIO_SETS = {
  1: [1.0],
  4: [3.06, 1.96, 1.31, 1.00],
  5: [3.50, 2.17, 1.47, 1.08, 0.83],
  6: [3.83, 2.36, 1.69, 1.31, 1.00, 0.79],
  7: [3.97, 2.77, 2.00, 1.55, 1.21, 0.97, 0.79],
  8: [4.71, 3.14, 2.10, 1.67, 1.29, 1.00, 0.84, 0.67],
  10: [4.70, 2.99, 2.15, 1.77, 1.52, 1.28, 1.00, 0.85, 0.69, 0.64],
};

const FINAL_DRIVES = {
  compact: 4.06, jdm: 3.55, muscle: 3.73, truck: 3.73,
  suv: 3.55, euro: 3.15, exotic: 3.42, electric: 9.73,
};

const DRIVETRAIN_GRIP = { fwd: 0.80, rwd: 1.0, awd: 1.35 };

class PhysicsCar {
  constructor(carStats, effectiveStats) {
    this.hp = effectiveStats?.effectiveHP || carStats.hp;
    this.baseTorque = carStats.torque || (this.hp * 0.85);
    this.torqueMultiplier = this.hp / (carStats.hp || this.hp);
    this.weight = carStats.weight - (effectiveStats?.weightReduction || 0);
    this.mass = this.weight / 32.174;
    this.gears = carStats.gears || 6;
    this.redline = carStats.redline || 7000;
    this.isElectric = this.gears === 1;
    this.gearRatios = RATIO_SETS[this.gears] || RATIO_SETS[6];
    this.finalDrive = FINAL_DRIVES[carStats.category] || 3.55;
    this.tireDiameter = 26;
    this.tireRadius = this.tireDiameter / 24;

    const dt = carStats.drivetrain || 'rwd';
    this.baseTireGrip = (DRIVETRAIN_GRIP[dt] || 1.0) + (effectiveStats?.gripBonus || 0);
    this.dragCoeff = 0.35;

    // State
    this.rpm = this.isElectric ? 0 : 800;
    this.gear = 1;
    this.speed = 0;
    this.speedFps = 0;
    this.distance = 0;
    this.time = 0;
    this.launched = false;
    this.finished = false;
    this.finalET = 0;
    this.trapSpeed = 0;
    this.launchRPM = 0;
    this.clutchEngaged = false;
  }

  getTorqueAtRPM() {
    if (this.isElectric) {
      const speedPct = Math.min(this.speed / 200, 1);
      return this.baseTorque * this.torqueMultiplier * Math.max(0.3, 1 - speedPct * 0.45);
    }
    const rpmPct = this.rpm / this.redline;
    let curve;
    if (rpmPct < 0.15) curve = 0.4 + rpmPct * 3.5;
    else if (rpmPct < 0.65) curve = 0.92 + rpmPct * 0.12;
    else if (rpmPct < 0.85) curve = 1.0 - (rpmPct - 0.65) * 0.35;
    else curve = 0.93 - (rpmPct - 0.85) * 2.0;
    return this.baseTorque * this.torqueMultiplier * Math.max(0.15, curve);
  }

  launch() {
    this.launched = true;
    this.launchRPM = this.isElectric ? 0 : 3500 + Math.random() * 1500;
    this.rpm = this.launchRPM;
    this.clutchEngaged = false;
  }

  update(dt) {
    if (!this.launched || this.finished) return;
    this.time += dt;

    const gearRatio = this.gearRatios[this.gear - 1];
    const totalRatio = gearRatio * this.finalDrive;

    // Calculate RPM from speed (when clutch engaged)
    const rpmFromSpeed = Math.max(800, this.speed * totalRatio * 336 / this.tireDiameter);

    if (!this.isElectric) {
      if (!this.clutchEngaged && this.time < 1.2 && this.gear === 1) {
        const blend = Math.min(this.time / 0.7, 1);
        this.rpm = this.launchRPM * (1 - blend) + rpmFromSpeed * blend;
        if (blend >= 0.95) this.clutchEngaged = true;
      } else {
        this.clutchEngaged = true;
        this.rpm = rpmFromSpeed;
      }
      this.rpm = Math.max(800, Math.min(this.rpm, this.redline + 50));
    } else {
      this.rpm = rpmFromSpeed;
    }

    // At rev limiter: drastically reduce torque
    const atRedline = !this.isElectric && this.rpm >= this.redline;
    if (atRedline) this.rpm = this.redline;

    const torque = atRedline
      ? this.baseTorque * this.torqueMultiplier * 0.05
      : this.getTorqueAtRPM();

    const wheelTorque = torque * totalRatio * 0.85;
    const wheelForce = wheelTorque / this.tireRadius;

    const maxTraction = this.baseTireGrip * this.weight;
    const effectiveForce = Math.min(wheelForce, maxTraction);

    const dragForce = 0.5 * this.dragCoeff * 8 * 0.002378 * this.speedFps * this.speedFps;
    const rollingResistance = 0.012 * this.weight;

    const netForce = effectiveForce - dragForce - rollingResistance;
    const acceleration = Math.max(-10, netForce / this.mass);

    this.speedFps = Math.max(0, this.speedFps + acceleration * dt);
    this.speed = this.speedFps / 1.467;
    this.distance += this.speedFps * dt;

    if (this.distance >= QUARTER_MILE) {
      this.finished = true;
      this.distance = QUARTER_MILE;
      this.finalET = parseFloat(this.time.toFixed(3));
      this.trapSpeed = parseFloat(this.speed.toFixed(1));
    }
  }

  shift() {
    if (this.isElectric || this.gear >= this.gears) return null;
    const rpmPct = this.rpm / this.redline;
    let quality;
    if (rpmPct >= 0.82 && rpmPct <= 0.93) quality = 'perfect';
    else if (rpmPct >= 0.72 && rpmPct <= 0.96) quality = 'good';
    else if (rpmPct >= 0.50) quality = 'early';
    else quality = 'bad';

    const oldRatio = this.gearRatios[this.gear - 1];
    this.gear++;
    const newRatio = this.gearRatios[this.gear - 1];
    this.rpm = Math.max(2000, this.rpm * (newRatio / oldRatio));
    return quality;
  }
}

class AIDriver {
  constructor(physicsCar, shiftPoint, reactionDelay) {
    this.car = physicsCar;
    this.shiftPoint = shiftPoint;
    this.reactionDelay = reactionDelay;
    this.timeSinceLaunch = 0;
  }

  update(dt) {
    if (!this.car.launched) return;
    this.timeSinceLaunch += dt;
    this.car.update(dt);
    if (!this.car.isElectric && this.car.gear < this.car.gears) {
      if (this.car.rpm / this.car.redline >= this.shiftPoint) {
        this.car.shift();
      }
    }
  }
}

function createAIPhysicsCar(opponentData) {
  const targetET = opponentData.et;
  const targetTrap = opponentData.trap;
  const weight = 3500;
  const k = 5.825;
  const hp = Math.round(weight / Math.pow(targetET / k, 3));
  const torque = Math.round(hp * 0.88);
  return new PhysicsCar(
    { hp, torque, weight, gears: 6, redline: 7000, category: 'muscle', drivetrain: 'rwd' },
    { effectiveHP: hp, weightReduction: 0, gripBonus: 0 }
  );
}

// ===== MAIN RACE ENGINE =====
export class RaceEngine {
  constructor(playerCar, opponentData) {
    this.playerPhysics = new PhysicsCar(
      { ...playerCar.catalog, drivetrain: playerCar.catalog.drivetrain || 'rwd' },
      playerCar.effective_stats
    );
    this.aiPhysics = createAIPhysicsCar(opponentData);

    const diff = opponentData.difficulty || 'medium';
    const shiftPoint = { easy: 0.78, medium: 0.86, hard: 0.91, boss: 0.93 }[diff] || 0.86;
    const reactionDelay = { easy: 0.35, medium: 0.22, hard: 0.12, boss: 0.06 }[diff] || 0.22;
    this.aiDriver = new AIDriver(this.aiPhysics, shiftPoint + Math.random() * 0.04, reactionDelay + Math.random() * 0.08);

    this.isElectric = playerCar.catalog.gears === 1;
    this.playerRedline = playerCar.catalog.redline || 7000;

    this.state = 'idle';
    this.raceTime = 0;
    this.greenLightTime = 0;
    this.countdownStep = 0;
    this.lastUpdateTime = 0;

    this.player = {
      rpm: 800, gear: 1, speed: 0, distance: 0,
      launched: false, finished: false,
      reactionTime: 0, finalET: 0, trapSpeed: 0,
      shiftCount: 0, shiftQualities: []
    };
    this.opponent = {
      rpm: 800, gear: 1, speed: 0, distance: 0,
      launched: false, finished: false,
      reactionTime: this.aiDriver.reactionDelay,
      finalET: 0, trapSpeed: 0
    };
    this.winner = null;
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
      this.lastUpdateTime = this.greenLightTime;
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
    this.playerPhysics.launch();
    this.state = 'racing';
    this.lastUpdateTime = launchTime;
    return reaction;
  }

  playerShift() {
    if (!this.player.launched || this.player.finished) return null;
    const quality = this.playerPhysics.shift();
    if (quality) {
      this.player.shiftCount++;
      this.player.shiftQualities.push(quality);
    }
    return quality;
  }

  update(now) {
    if (this.state !== 'racing' && this.state !== 'green') return;
    const dt = Math.min((now - this.lastUpdateTime) / 1000, 0.05);
    this.lastUpdateTime = now;
    if (dt <= 0) return;

    // Player physics
    if (this.player.launched && !this.player.finished) {
      this.raceTime += dt;
      this.playerPhysics.update(dt);
      this.player.rpm = this.playerPhysics.rpm;
      this.player.gear = this.playerPhysics.gear;
      this.player.speed = this.playerPhysics.speed;
      this.player.distance = this.playerPhysics.distance;
      if (this.playerPhysics.finished) {
        this.player.finished = true;
        this.player.finalET = this.playerPhysics.finalET;
        this.player.trapSpeed = this.playerPhysics.trapSpeed;
      }
    }

    // AI launch after reaction delay
    const timeSinceGreen = (now - this.greenLightTime) / 1000;
    if (!this.opponent.launched && timeSinceGreen >= this.aiDriver.reactionDelay) {
      this.opponent.launched = true;
      this.aiPhysics.launch();
    }

    // AI physics
    if (this.opponent.launched && !this.opponent.finished) {
      this.aiDriver.update(dt);
      this.opponent.rpm = this.aiPhysics.rpm;
      this.opponent.gear = this.aiPhysics.gear;
      this.opponent.speed = this.aiPhysics.speed;
      this.opponent.distance = this.aiPhysics.distance;
      if (this.aiPhysics.finished) {
        this.opponent.finished = true;
        this.opponent.finalET = this.aiPhysics.finalET;
        this.opponent.trapSpeed = this.aiPhysics.trapSpeed;
      }
    }

    if (this.player.finished && this.opponent.finished && !this.winner) {
      const pET = this.player.finalET + this.player.reactionTime;
      const oET = this.opponent.finalET + this.opponent.reactionTime;
      this.winner = pET <= oET ? 'player' : 'opponent';
    }
  }

  isFinished() { return this.player.finished && this.opponent.finished; }

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
    };
  }
}

// ===== CANVAS RENDERING =====
export function drawTachometer(ctx, w, h, rpm, redline, gear, isElectric) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h * 0.55;
  const radius = Math.min(w, h) * 0.38;
  const startDeg = 150, sweepDeg = 240;
  const startRad = startDeg * Math.PI / 180;
  const sweepRad = sweepDeg * Math.PI / 180;

  // Outer ring metallic effect
  const ringGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  ringGrad.addColorStop(0, '#2a2a30');
  ringGrad.addColorStop(0.5, '#3a3a42');
  ringGrad.addColorStop(1, '#1a1a20');
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 12, 0, Math.PI * 2);
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 6;
  ctx.stroke();

  // Dark inner fill
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
  ctx.fillStyle = '#08080c';
  ctx.fill();

  // Bolts
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const bx = cx + Math.cos(a) * (radius + 12);
    const by = cy + Math.sin(a) * (radius + 12);
    ctx.beginPath();
    ctx.arc(bx, by, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#444';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx - 0.5, by - 0.5, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#555';
    ctx.fill();
  }

  // Background arc
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startRad, startRad + sweepRad);
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 16;
  ctx.lineCap = 'butt';
  ctx.stroke();

  // Color zones
  const zones = [
    { end: 0.70, color: '#1a2a1a' },
    { end: 0.82, color: '#0a4a0a' },
    { end: 0.93, color: '#00cc66' },
    { end: 0.97, color: '#cc8800' },
    { end: 1.00, color: '#cc2244' },
  ];
  let lastEnd = 0;
  zones.forEach(z => {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startRad + sweepRad * lastEnd, startRad + sweepRad * z.end);
    ctx.strokeStyle = z.color;
    ctx.lineWidth = 16;
    ctx.lineCap = 'butt';
    ctx.stroke();
    lastEnd = z.end;
  });

  // Tick marks and labels
  for (let i = 0; i <= 10; i++) {
    const angle = startRad + sweepRad * (i / 10);
    const isLong = i % 2 === 0;
    const innerR = radius - (isLong ? 24 : 20);
    const outerR = radius + 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    ctx.strokeStyle = isLong ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = isLong ? 2.5 : 1;
    ctx.stroke();
    if (isLong && redline > 0) {
      const labelR = radius - 34;
      ctx.font = "bold 10px 'Chakra Petch', sans-serif";
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(redline * i / 10000).toString(), cx + Math.cos(angle) * labelR, cy + Math.sin(angle) * labelR);
    }
  }

  // SHIFT zone indicator
  if (!isElectric) {
    const rpmPct = rpm / redline;
    if (rpmPct >= 0.78 && rpmPct <= 0.96) {
      const shiftAngle = startRad + sweepRad * rpmPct;
      const glowIntensity = rpmPct >= 0.82 && rpmPct <= 0.93 ? 0.8 : 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 20, startRad + sweepRad * 0.82, startRad + sweepRad * 0.93);
      ctx.strokeStyle = `rgba(0, 255, 136, ${glowIntensity})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  // Needle shadow
  const rpmPct = isElectric ? Math.min(rpm / 15000, 1) : Math.min(rpm / redline, 1.02);
  const needleAngle = startRad + sweepRad * rpmPct;
  const needleLen = radius - 4;
  ctx.beginPath();
  ctx.moveTo(cx + 1, cy + 1);
  ctx.lineTo(cx + Math.cos(needleAngle) * needleLen + 1, cy + Math.sin(needleAngle) * needleLen + 1);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Needle
  const needleColor = rpmPct > 0.93 ? '#ff2244' : rpmPct > 0.82 ? '#00ff88' : '#ff4444';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(needleAngle) * needleLen, cy + Math.sin(needleAngle) * needleLen);
  ctx.strokeStyle = needleColor;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.stroke();
  // Needle glow
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(needleAngle) * needleLen, cy + Math.sin(needleAngle) * needleLen);
  ctx.strokeStyle = needleColor + '30';
  ctx.lineWidth = 10;
  ctx.stroke();

  // Center cap (metallic)
  const capGrad = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, 12);
  capGrad.addColorStop(0, '#666');
  capGrad.addColorStop(0.4, '#444');
  capGrad.addColorStop(1, '#111');
  ctx.beginPath();
  ctx.arc(cx, cy, 11, 0, Math.PI * 2);
  ctx.fillStyle = capGrad;
  ctx.fill();
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Digital RPM
  ctx.font = "bold 20px 'Chakra Petch', sans-serif";
  ctx.fillStyle = rpmPct > 0.93 ? '#ff2244' : '#e0e0e8';
  ctx.textAlign = 'center';
  ctx.fillText(Math.round(rpm).toLocaleString(), cx, cy + 24);
  ctx.font = "9px 'Barlow', sans-serif";
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText('RPM x1000', cx, cy + 38);

  // Gear
  ctx.font = "bold 18px 'Chakra Petch', sans-serif";
  ctx.fillStyle = '#00ff88';
  ctx.fillText(isElectric ? 'D' : `G${gear}`, cx, cy + 56);
}

export function drawRaceScene(ctx, width, height, engine, playerColor, opponentColor) {
  ctx.clearRect(0, 0, width, height);

  // Night sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.35);
  skyGrad.addColorStop(0, '#030308');
  skyGrad.addColorStop(1, '#0a0a16');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height * 0.35);

  // Stars
  for (let i = 0; i < 50; i++) {
    const sx = (i * 41 + 17) % width;
    const sy = (i * 29 + 11) % (height * 0.28);
    ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.3})`;
    ctx.fillRect(sx, sy, 1, 1);
  }

  // Cityscape silhouette
  ctx.fillStyle = '#070710';
  for (let i = 0; i < 20; i++) {
    const bx = i * (width / 15) - 30;
    const bw = 30 + (i % 4) * 25;
    const bh = 20 + (i % 7) * 22;
    ctx.fillRect(bx, height * 0.35 - bh, bw, bh);
    // Window lights
    for (let wy = 4; wy < bh - 4; wy += 7) {
      for (let wx = 3; wx < bw - 3; wx += 8) {
        if (Math.random() > 0.7) {
          ctx.fillStyle = `rgba(255,200,50,${0.08 + Math.random() * 0.08})`;
          ctx.fillRect(bx + wx, height * 0.35 - bh + wy, 3, 3);
        }
      }
      ctx.fillStyle = '#070710';
    }
  }

  // Road surface with texture
  const roadGrad = ctx.createLinearGradient(0, height * 0.35, 0, height);
  roadGrad.addColorStop(0, '#161620');
  roadGrad.addColorStop(0.3, '#121218');
  roadGrad.addColorStop(1, '#0e0e14');
  ctx.fillStyle = roadGrad;
  ctx.fillRect(0, height * 0.35, width, height * 0.65);

  // Camera tracking
  const maxDist = Math.max(engine.player.distance, engine.opponent.distance, 100);
  const viewRange = Math.max(maxDist * 1.2, 300);
  const pxPerFoot = width * 0.7 / viewRange;
  const cameraX = Math.max(0, (engine.player.distance + engine.opponent.distance) / 2 * pxPerFoot - width * 0.4);

  // Lane markings (scrolling)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.setLineDash([35, 25]);
  ctx.lineWidth = 2;
  const offset = cameraX % 60;
  ctx.beginPath();
  ctx.moveTo(-offset, height * 0.56);
  ctx.lineTo(width + 60, height * 0.56);
  ctx.stroke();
  ctx.setLineDash([]);

  // Lane edges
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  [0.37, 0.75].forEach(y => {
    ctx.beginPath();
    ctx.moveTo(0, height * y);
    ctx.lineTo(width, height * y);
    ctx.stroke();
  });

  // Finish line
  const finishX = QUARTER_MILE * pxPerFoot - cameraX;
  if (finishX > -30 && finishX < width + 30) {
    const sz = 7;
    for (let row = 0; row < Math.floor(height * 0.4 / sz); row++) {
      for (let col = 0; col < 3; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)';
        ctx.fillRect(finishX + col * sz, height * 0.36 + row * sz, sz, sz);
      }
    }
  }

  // Distance markers every 330 feet (1/4 of QM)
  for (let d = 330; d <= 1320; d += 330) {
    const mx = d * pxPerFoot - cameraX;
    if (mx > 0 && mx < width) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.font = "9px 'Barlow', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(`${d}'`, mx, height * 0.35 + 12);
    }
  }

  // Cars
  const playerX = engine.player.distance * pxPerFoot - cameraX;
  const opponentX = engine.opponent.distance * pxPerFoot - cameraX;
  drawCar(ctx, playerX, height * 0.41, 95, 34, playerColor, engine.player.speed);
  drawCar(ctx, opponentX, height * 0.61, 95, 34, opponentColor, engine.opponent.speed);

  // Speed lines for player
  if (engine.player.speed > 40) {
    const intensity = Math.min((engine.player.speed - 40) / 120, 0.5);
    ctx.strokeStyle = `rgba(255,255,255,${intensity * 0.2})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const ly = height * 0.41 + 5 + i * 5;
      const lx = playerX - 15 - Math.random() * 50;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx - 15 - Math.random() * 40, ly);
      ctx.stroke();
    }
  }

  // Tire smoke on launch
  if (engine.player.launched && engine.raceTime < 1.5) {
    const smokeAlpha = Math.max(0, 0.3 - engine.raceTime * 0.2);
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(playerX - 10 - Math.random() * 20, height * 0.46 + 10 + Math.random() * 8, 6 + Math.random() * 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,180,180,${smokeAlpha * Math.random()})`;
      ctx.fill();
    }
  }
}

function drawCar(ctx, x, y, w, h, color, speed) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h + 4, w * 0.45, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (3D-ish with highlight)
  const bodyGrad = ctx.createLinearGradient(x, y, x, y + h * 0.7);
  bodyGrad.addColorStop(0, lightenColor(color, 30));
  bodyGrad.addColorStop(0.4, color);
  bodyGrad.addColorStop(1, darkenColor(color, 40));
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.5);
  ctx.lineTo(x + w * 0.04, y + h * 0.35);
  ctx.lineTo(x + w * 0.14, y + h * 0.15);
  ctx.lineTo(x + w * 0.26, y);
  ctx.lineTo(x + w * 0.66, y);
  ctx.lineTo(x + w * 0.80, y + h * 0.15);
  ctx.lineTo(x + w * 0.93, y + h * 0.28);
  ctx.lineTo(x + w, y + h * 0.42);
  ctx.lineTo(x + w, y + h * 0.68);
  ctx.lineTo(x, y + h * 0.68);
  ctx.closePath();
  ctx.fill();

  // Window
  ctx.fillStyle = 'rgba(60, 120, 180, 0.25)';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.28, y + h * 0.04);
  ctx.lineTo(x + w * 0.64, y + h * 0.04);
  ctx.lineTo(x + w * 0.74, y + h * 0.18);
  ctx.lineTo(x + w * 0.20, y + h * 0.18);
  ctx.closePath();
  ctx.fill();
  // Window glare
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.30, y + h * 0.05);
  ctx.lineTo(x + w * 0.45, y + h * 0.05);
  ctx.lineTo(x + w * 0.40, y + h * 0.12);
  ctx.lineTo(x + w * 0.25, y + h * 0.12);
  ctx.closePath();
  ctx.fill();

  // Wheels with 3D effect
  [0.18, 0.80].forEach(pos => {
    const wx = x + w * pos, wy = y + h * 0.74;
    // Tire
    ctx.beginPath();
    ctx.arc(wx, wy, h * 0.24, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();
    // Rim
    const rimGrad = ctx.createRadialGradient(wx - 1, wy - 1, 1, wx, wy, h * 0.14);
    rimGrad.addColorStop(0, '#888');
    rimGrad.addColorStop(0.5, '#555');
    rimGrad.addColorStop(1, '#333');
    ctx.beginPath();
    ctx.arc(wx, wy, h * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = rimGrad;
    ctx.fill();
    // Hub
    ctx.beginPath();
    ctx.arc(wx, wy, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#aaa';
    ctx.fill();
  });

  // Taillights
  ctx.fillStyle = '#ff2200';
  ctx.shadowColor = '#ff2200';
  ctx.shadowBlur = speed > 30 ? 8 : 3;
  ctx.fillRect(x + w * 0.97, y + h * 0.35, 3, h * 0.12);
  ctx.fillRect(x + w * 0.97, y + h * 0.52, 3, h * 0.08);
  ctx.shadowBlur = 0;

  // Headlights
  if (speed > 0) {
    ctx.fillStyle = '#ffffcc';
    ctx.shadowColor = '#ffffcc';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(x + w * 0.02, y + h * 0.40, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function lightenColor(hex, amt) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amt);
  const g = Math.min(255, ((num >> 8) & 0xFF) + amt);
  const b = Math.min(255, (num & 0xFF) + amt);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex, amt) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amt);
  const g = Math.max(0, ((num >> 8) & 0xFF) - amt);
  const b = Math.max(0, (num & 0xFF) - amt);
  return `rgb(${r},${g},${b})`;
}
