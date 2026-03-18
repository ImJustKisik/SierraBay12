;(function () {
	var h = SUI.h
	var useBackend = SUI.useBackend
	var useEffect = SUI.useEffect
	var useRef = SUI.useRef
	var useState = SUI.useState
	var NTOS = SUI.NTOS
	var StatePanel = NTOS && NTOS.StatePanel

	var CHEAT_CODE = "WOLF3D"
	var WOLF_LEVELS = [
		{
			name: "Sector 01",
			status: "Locate the exit terminal.",
			map: [
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
				[1,0,2,0,2,0,0,0,3,0,0,0,2,0,0,1],
				[1,0,0,0,0,0,1,0,0,0,2,0,0,0,0,1],
				[1,0,2,0,3,0,1,0,2,0,0,0,3,0,0,1],
				[1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
				[1,0,3,0,2,0,0,0,1,1,1,0,2,0,0,1],
				[1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
				[1,0,2,0,1,1,1,0,3,0,1,0,2,0,0,1],
				[1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1],
				[1,0,3,0,2,0,1,1,1,0,0,0,3,0,0,1],
				[1,0,0,0,0,0,0,0,1,0,2,0,0,0,0,1],
				[1,0,2,0,3,0,2,0,1,0,0,0,2,0,0,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,0,5,1],
				[1,0,0,0,2,0,3,0,2,0,0,0,3,0,0,1],
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
			],
			player: { x: 3.5, y: 3.5, dirX: -1, dirY: 0, planeX: 0, planeY: 0.66 },
			enemies: [
				{ x: 10.5, y: 2.5, health: 40, cooldown: 1.0, kind: "guard" },
				{ x: 12.5, y: 6.5, health: 40, cooldown: 1.4, kind: "guard" },
				{ x: 8.5, y: 10.5, health: 50, cooldown: 1.2, kind: "elite" },
				{ x: 4.5, y: 13.5, health: 35, cooldown: 1.1, kind: "dog" }
			],
			pickups: [
				{ x: 2.5, y: 5.5, type: "ammo" },
				{ x: 13.5, y: 4.5, type: "med" },
				{ x: 11.5, y: 12.5, type: "ammo" },
				{ x: 6.5, y: 8.5, type: "med" },
				{ x: 13.5, y: 13.5, type: "key" }
			]
		},
		{
			name: "Sector 02",
			status: "Sweep the barracks and reach the blast door.",
			map: [
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
				[1,0,0,0,0,0,1,0,0,0,0,0,0,0,5,1],
				[1,0,2,2,2,0,1,0,3,3,3,0,2,0,0,1],
				[1,0,0,0,2,0,1,0,0,0,3,0,0,0,0,1],
				[1,1,1,0,2,0,1,1,1,0,3,1,1,1,0,1],
				[1,0,0,0,0,0,0,0,1,0,0,0,0,1,0,1],
				[1,0,3,3,3,1,1,0,1,2,2,2,0,1,0,1],
				[1,0,0,0,0,0,1,0,0,0,0,2,0,0,0,1],
				[1,0,2,0,1,0,1,1,1,1,0,2,0,1,0,1],
				[1,0,2,0,1,0,0,0,0,1,0,0,0,1,0,1],
				[1,0,2,0,1,1,1,0,0,1,1,1,0,1,0,1],
				[1,0,0,0,0,0,1,0,0,0,0,1,0,1,0,1],
				[1,0,3,0,2,0,1,1,1,1,0,1,0,1,0,1],
				[1,0,0,0,2,0,0,0,0,0,0,0,0,1,0,1],
				[1,0,0,0,0,0,2,2,2,0,0,0,0,0,0,1],
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
			],
			player: { x: 1.5, y: 14.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 },
			enemies: [
				{ x: 3.5, y: 2.5, health: 40, cooldown: 1.0, kind: "guard" },
				{ x: 9.5, y: 2.5, health: 50, cooldown: 1.0, kind: "elite" },
				{ x: 10.5, y: 6.5, health: 40, cooldown: 1.1, kind: "guard" },
				{ x: 4.5, y: 12.5, health: 35, cooldown: 0.9, kind: "dog" },
				{ x: 12.5, y: 13.5, health: 40, cooldown: 1.1, kind: "guard" }
			],
			pickups: [
				{ x: 2.5, y: 10.5, type: "ammo" },
				{ x: 5.5, y: 5.5, type: "med" },
				{ x: 11.5, y: 8.5, type: "ammo" },
				{ x: 13.5, y: 3.5, type: "key" }
			]
		},
		{
			name: "Sector 03",
			status: "Final sector. Secure the key and escape alive.",
			map: [
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
				[1,0,0,0,0,0,0,0,0,0,0,0,0,0,5,1],
				[1,0,3,3,0,2,2,0,3,3,0,2,2,0,0,1],
				[1,0,0,3,0,0,2,0,0,3,0,0,2,0,0,1],
				[1,1,0,3,1,0,2,1,0,3,1,0,2,1,0,1],
				[1,0,0,0,1,0,0,1,0,0,1,0,0,1,0,1],
				[1,0,2,0,1,1,0,1,1,0,1,1,0,1,0,1],
				[1,0,2,0,0,0,0,0,1,0,0,0,0,1,0,1],
				[1,0,2,1,1,1,1,0,1,1,1,1,0,1,0,1],
				[1,0,0,0,0,0,1,0,0,0,0,1,0,1,0,1],
				[1,0,3,3,3,0,1,1,1,1,0,1,0,1,0,1],
				[1,0,0,0,3,0,0,0,0,1,0,0,0,1,0,1],
				[1,0,2,0,3,1,1,1,0,1,1,1,0,1,0,1],
				[1,0,2,0,0,0,0,1,0,0,0,0,0,0,0,1],
				[1,0,0,0,0,0,0,1,2,2,2,0,0,0,0,1],
				[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
			],
			player: { x: 1.5, y: 13.5, dirX: 1, dirY: 0, planeX: 0, planeY: 0.66 },
			enemies: [
				{ x: 3.5, y: 2.5, health: 40, cooldown: 1.0, kind: "guard" },
				{ x: 9.5, y: 2.5, health: 50, cooldown: 0.9, kind: "elite" },
				{ x: 2.5, y: 10.5, health: 40, cooldown: 1.0, kind: "guard" },
				{ x: 5.5, y: 13.5, health: 35, cooldown: 0.9, kind: "dog" },
				{ x: 10.5, y: 14.5, health: 50, cooldown: 0.8, kind: "elite" },
				{ x: 12.5, y: 8.5, health: 40, cooldown: 1.0, kind: "guard" }
			],
			pickups: [
				{ x: 2.5, y: 7.5, type: "ammo" },
				{ x: 4.5, y: 4.5, type: "med" },
				{ x: 8.5, y: 11.5, type: "ammo" },
				{ x: 13.5, y: 12.5, type: "med" },
				{ x: 11.5, y: 4.5, type: "key" }
			]
		}
	]

	function StatCard(props) {
		var title = props.title
		var health = Number(props.health) || 0
		var mana = Number(props.mana) || 0
		var maxHealth = props.maxHealth
		var maxMana = props.maxMana

		return h(SUI.Section, { title: title },
			h(SUI.LabeledList, null,
				h(SUI.LabeledList.Item, { label: "Health" },
					h(SUI.ProgressBar, {
						value: health,
						min: 0,
						max: maxHealth,
						color: health > maxHealth * 0.5 ? "good" : (health > maxHealth * 0.25 ? "average" : "bad"),
						showText: String(health)
					})
				),
				h(SUI.LabeledList.Item, { label: "Energy" },
					h(SUI.ProgressBar, {
						value: mana,
						min: 0,
						max: maxMana,
						color: mana > maxMana * 0.4 ? "good" : "average",
						showText: String(mana)
					})
				)
			)
		)
	}

	function RetroEmulator(props) {
		var canvasRef = useRef(null)
		var level = WOLF_LEVELS[props.levelIndex || 0] || WOLF_LEVELS[0]
		var hudState = useState({
			health: 100,
			ammo: 12,
			enemies: 0,
			status: level.status || "Locate the exit terminal."
		})
		var hud = hudState[0]
		var setHud = hudState[1]

		useEffect(function () {
			var canvas = canvasRef.current
			if (!canvas) {
				return
			}

			var ctx = canvas.getContext("2d")
			if (!ctx) {
				return
			}

			var width = canvas.width
			var height = canvas.height
			var map = level.map.map(function (row) { return row.slice() })

			var player = {
				x: level.player.x,
				y: level.player.y,
				dirX: level.player.dirX,
				dirY: level.player.dirY,
				planeX: level.player.planeX,
				planeY: level.player.planeY,
				health: 100,
				ammo: 12,
				hasKey: false,
				hitFlash: 0
			}

			var enemies = level.enemies.map(function (enemy) {
				return {
					x: enemy.x,
					y: enemy.y,
					health: enemy.health,
					alive: true,
					cooldown: enemy.cooldown,
					kind: enemy.kind,
					dying: false,
					deathTimer: 0
				}
			})

			var pickups = level.pickups.map(function (pickup) {
				return {
					x: pickup.x,
					y: pickup.y,
					type: pickup.type,
					active: true
				}
			})

			var keys = {}
			var animationId = 0
			var lastTime = performance.now()
			var shootCooldown = 0
			var gameWon = false
			var gameOver = false
			var zBuffer = new Array(width)
			var hudTimer = 0
			var muzzleFlash = 0
			var damagePopups = []

			function pushHudStatus(text) {
				setHud({
					health: player.health,
					ammo: player.ammo,
					enemies: enemies.filter(function (enemy) { return enemy.alive }).length,
					status: text
				})
			}

			function getWallColor(tile) {
				if (tile === 1) return [59, 130, 246]
				if (tile === 2) return [34, 197, 94]
				if (tile === 3) return [239, 68, 68]
				if (tile === 5) return player.hasKey ? [250, 204, 21] : [99, 102, 241]
				return [148, 163, 184]
			}

			function drawVerticalLine(x, start, end, tile, darken) {
				var rgb = getWallColor(tile)
				var shade = darken ? 0.62 : 1
				ctx.fillStyle = "rgb(" +
					Math.round(rgb[0] * shade) + "," +
					Math.round(rgb[1] * shade) + "," +
					Math.round(rgb[2] * shade) + ")"
				ctx.fillRect(x, start, 1, Math.max(1, end - start + 1))
			}

			function canWalk(x, y) {
				var tile = map[Math.floor(y)][Math.floor(x)]
				return tile === 0 || tile === 5
			}

			function isSpawnClear(x, y, radius) {
				radius = radius || 0.34
				if (!canWalk(x, y)) {
					return false
				}

				var points = [
					[x - radius, y - radius],
					[x + radius, y - radius],
					[x - radius, y + radius],
					[x + radius, y + radius]
				]

				for (var i = 0; i < points.length; i++) {
					if (!canWalk(points[i][0], points[i][1])) {
						return false
					}
				}
				return true
			}

			function relocateToNearestOpenSpot(entity, radius) {
				if (isSpawnClear(entity.x, entity.y, radius)) {
					return
				}

				var baseX = Math.floor(entity.x)
				var baseY = Math.floor(entity.y)
				for (var ring = 1; ring <= 8; ring++) {
					for (var oy = -ring; oy <= ring; oy++) {
						for (var ox = -ring; ox <= ring; ox++) {
							var candidateX = baseX + ox + 0.5
							var candidateY = baseY + oy + 0.5
							if (isSpawnClear(candidateX, candidateY, radius)) {
								entity.x = candidateX
								entity.y = candidateY
								return
							}
						}
					}
				}
			}

			for (var enemyIndex = 0; enemyIndex < enemies.length; enemyIndex++) {
				relocateToNearestOpenSpot(enemies[enemyIndex], 0.34)
			}
			for (var pickupIndex = 0; pickupIndex < pickups.length; pickupIndex++) {
				relocateToNearestOpenSpot(pickups[pickupIndex], 0.22)
			}

			function hasLineOfSight(fromX, fromY, toX, toY) {
				var dx = toX - fromX
				var dy = toY - fromY
				var distance = Math.sqrt(dx * dx + dy * dy)
				if (distance <= 0.001) {
					return true
				}

				var steps = Math.max(1, Math.ceil(distance * 14))
				for (var step = 1; step < steps; step++) {
					var px = fromX + dx * (step / steps)
					var py = fromY + dy * (step / steps)
					var tile = map[Math.floor(py)][Math.floor(px)]
					if (tile > 0 && tile !== 5) {
						return false
					}
				}
				return true
			}

			function tryShoot() {
				if (shootCooldown > 0 || gameWon || gameOver) {
					return
				}
				shootCooldown = 0.32
				muzzleFlash = 0.1
				if (player.ammo <= 0) {
					pushHudStatus("Click. No ammo.")
					return
				}

				player.ammo--
				var bestEnemy = null
				var bestDist = 999
				for (var i = 0; i < enemies.length; i++) {
					var enemy = enemies[i]
					if (!enemy.alive || enemy.dying) continue

					var dx = enemy.x - player.x
					var dy = enemy.y - player.y
					var dist = Math.sqrt(dx * dx + dy * dy)
					var dot = (dx / Math.max(dist, 0.001)) * player.dirX + (dy / Math.max(dist, 0.001)) * player.dirY
					if (dot < 0.965 || dist > 8.5) continue

					if (hasLineOfSight(player.x, player.y, enemy.x, enemy.y) && dist < bestDist) {
						bestDist = dist
						bestEnemy = enemy
					}
				}

				if (bestEnemy) {
					var dealtDamage = bestEnemy.kind === "elite" ? 18 : 25
					bestEnemy.health -= dealtDamage
					damagePopups.push({
						x: bestEnemy.x,
						y: bestEnemy.y,
						value: dealtDamage,
						life: 0.8
					})
					if (bestEnemy.health <= 0) {
						bestEnemy.dying = true
						bestEnemy.deathTimer = 0.6
						pushHudStatus("Target eliminated.")
					} else {
						pushHudStatus("Hit confirmed.")
					}
				} else {
					pushHudStatus("Shot missed.")
				}
			}

			function updatePlayer(delta) {
				var moveSpeed = delta * 3.2
				var rotSpeed = delta * 2.1
				shootCooldown = Math.max(0, shootCooldown - delta)
				muzzleFlash = Math.max(0, muzzleFlash - delta)
				player.hitFlash = Math.max(0, player.hitFlash - delta)

				if (keys["KeyW"]) {
					var nextX = player.x + player.dirX * moveSpeed
					var nextY = player.y + player.dirY * moveSpeed
					if (canWalk(nextX, player.y)) player.x = nextX
					if (canWalk(player.x, nextY)) player.y = nextY
				}
				if (keys["KeyS"]) {
					var prevX = player.x - player.dirX * moveSpeed
					var prevY = player.y - player.dirY * moveSpeed
					if (canWalk(prevX, player.y)) player.x = prevX
					if (canWalk(player.x, prevY)) player.y = prevY
				}

				var rotation = 0
				if (keys["KeyA"] || keys["ArrowLeft"]) rotation -= rotSpeed
				if (keys["KeyD"] || keys["ArrowRight"]) rotation += rotSpeed

				if (rotation !== 0) {
					var oldDirX = player.dirX
					player.dirX = player.dirX * Math.cos(rotation) - player.dirY * Math.sin(rotation)
					player.dirY = oldDirX * Math.sin(rotation) + player.dirY * Math.cos(rotation)

					var oldPlaneX = player.planeX
					player.planeX = player.planeX * Math.cos(rotation) - player.planeY * Math.sin(rotation)
					player.planeY = oldPlaneX * Math.sin(rotation) + player.planeY * Math.cos(rotation)
				}

				if (keys["Space"]) {
					tryShoot()
				}

				for (var p = 0; p < pickups.length; p++) {
					var pickup = pickups[p]
					if (!pickup.active) continue
					var pdx = pickup.x - player.x
					var pdy = pickup.y - player.y
					if (Math.sqrt(pdx * pdx + pdy * pdy) < 0.55) {
						pickup.active = false
						if (pickup.type === "ammo") {
							player.ammo += 6
							pushHudStatus("Ammo collected.")
						} else if (pickup.type === "med") {
							player.health = Math.min(100, player.health + 25)
							pushHudStatus("Medkit applied.")
						} else if (pickup.type === "key") {
							player.hasKey = true
							pushHudStatus("Exit key acquired.")
						}
					}
				}

				var exitTile = map[Math.floor(player.y)][Math.floor(player.x)]
				if (exitTile === 5 && player.hasKey && enemies.filter(function (enemy) { return enemy.alive }).length === 0) {
					gameWon = true
					pushHudStatus(props.isFinalLevel
						? "Final exit reached. Press Enter to complete."
						: "Exit reached. Press Enter for next sector.")
				}
			}

			function updateEnemies(delta) {
				for (var i = 0; i < enemies.length; i++) {
					var enemy = enemies[i]
					if (!enemy.alive) continue
					if (enemy.dying) {
						enemy.deathTimer = Math.max(0, enemy.deathTimer - delta)
						if (enemy.deathTimer <= 0) {
							enemy.alive = false
						}
						continue
					}
					enemy.cooldown = Math.max(0, enemy.cooldown - delta)

					var dx = player.x - enemy.x
					var dy = player.y - enemy.y
					var dist = Math.sqrt(dx * dx + dy * dy)
					var canSeePlayer = hasLineOfSight(enemy.x, enemy.y, player.x, player.y)
					if (dist < 0.7) {
						player.health = Math.max(0, player.health - delta * 18)
						player.hitFlash = 0.15
						continue
					}

					if (dist < 6.5 && canSeePlayer) {
						var move = delta * (enemy.kind === "dog" ? 1.6 : 1.05)
						var nx = enemy.x + dx / dist * move
						var ny = enemy.y + dy / dist * move
						if (canWalk(nx, enemy.y)) enemy.x = nx
						if (canWalk(enemy.x, ny)) enemy.y = ny

						if (dist < 4.5 && enemy.cooldown <= 0) {
							enemy.cooldown = enemy.kind === "elite" ? 0.8 : 1.1
							player.health = Math.max(0, player.health - (enemy.kind === "elite" ? 14 : 9))
							player.hitFlash = 0.2
							pushHudStatus("Under fire.")
						}
					}
				}

				if (player.health <= 0) {
					gameOver = true
					pushHudStatus("KIA. Simulation failed.")
				}
			}

			function updateDamagePopups(delta) {
				for (var i = damagePopups.length - 1; i >= 0; i--) {
					damagePopups[i].life -= delta
					if (damagePopups[i].life <= 0) {
						damagePopups.splice(i, 1)
					}
				}
			}

			function drawSprite(sprite, screenX, spriteHeight, color, yOffset) {
				var spriteWidth = spriteHeight
				var startX = Math.floor(screenX - spriteWidth / 2)
				var endX = Math.floor(screenX + spriteWidth / 2)
				var startY = Math.floor(height / 2 - spriteHeight / 2 + (yOffset || 0))
				var endY = Math.floor(startY + spriteHeight)
				ctx.fillStyle = color

				for (var stripe = startX; stripe < endX; stripe++) {
					if (stripe < 0 || stripe >= width) continue
					if (sprite.transformY >= zBuffer[stripe]) continue
					ctx.fillRect(stripe, startY, 1, Math.max(1, endY - startY))
				}
			}

			function drawHumanoidSprite(sprite, screenX, spriteHeight, palette) {
				var bodyWidth = spriteHeight * 0.34
				var bodyHeight = spriteHeight * 0.42
				var legWidth = spriteHeight * 0.1
				var legHeight = spriteHeight * 0.22
				var armWidth = spriteHeight * 0.08
				var armHeight = spriteHeight * 0.18
				var headSize = spriteHeight * 0.18
				var centerX = screenX
				var baseY = height / 2 + spriteHeight * 0.32

				function drawPart(left, top, partWidth, partHeight, color) {
					var startX = Math.floor(left)
					var endX = Math.floor(left + partWidth)
					var startY = Math.floor(top)
					var endY = Math.floor(top + partHeight)
					ctx.fillStyle = color
					for (var stripe = startX; stripe < endX; stripe++) {
						if (stripe < 0 || stripe >= width) continue
						if (sprite.transformY >= zBuffer[stripe]) continue
						ctx.fillRect(stripe, startY, 1, Math.max(1, endY - startY))
					}
				}

				drawPart(centerX - headSize / 2, baseY - bodyHeight - headSize - 4, headSize, headSize, palette.head)
				drawPart(centerX - bodyWidth / 2, baseY - bodyHeight, bodyWidth, bodyHeight, palette.body)
				drawPart(centerX - bodyWidth / 2 - armWidth, baseY - bodyHeight + 4, armWidth, armHeight, palette.arm)
				drawPart(centerX + bodyWidth / 2, baseY - bodyHeight + 4, armWidth, armHeight, palette.arm)
				drawPart(centerX - legWidth - 2, baseY, legWidth, legHeight, palette.leg)
				drawPart(centerX + 2, baseY, legWidth, legHeight, palette.leg)
				drawPart(centerX + bodyWidth / 2 + armWidth * 0.4, baseY - bodyHeight * 0.55, armWidth * 1.6, armHeight * 0.28, palette.weapon)
			}

			function renderSprites() {
				var sprites = []
				for (var i = 0; i < enemies.length; i++) {
					if (enemies[i].alive) {
						sprites.push({
							x: enemies[i].x,
							y: enemies[i].y,
							type: "enemy",
							kind: enemies[i].kind,
							dying: enemies[i].dying,
							deathTimer: enemies[i].deathTimer
						})
					}
				}
				for (var p = 0; p < pickups.length; p++) {
					if (pickups[p].active) {
						sprites.push({
							x: pickups[p].x,
							y: pickups[p].y,
							type: pickups[p].type
						})
					}
				}

				sprites.sort(function (a, b) {
					var ad = (player.x - a.x) * (player.x - a.x) + (player.y - a.y) * (player.y - a.y)
					var bd = (player.x - b.x) * (player.x - b.x) + (player.y - b.y) * (player.y - b.y)
					return bd - ad
				})

				for (var s = 0; s < sprites.length; s++) {
					var sprite = sprites[s]
					var spriteX = sprite.x - player.x
					var spriteY = sprite.y - player.y

					var invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY)
					var transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY)
					var transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY)
					if (transformY <= 0.1) continue

					var screenX = Math.floor((width / 2) * (1 + transformX / transformY))
					var spriteHeight = Math.abs(Math.floor(height / transformY))
					sprite.transformY = transformY

					if (sprite.type === "enemy") {
						if (sprite.kind === "dog") {
							var dogHeight = spriteHeight * 0.42
							var dogYOffset = spriteHeight * 0.26
							if (sprite.dying) {
								var dogDeathProgress = 1 - Math.max(0, sprite.deathTimer) / 0.6
								dogHeight *= 1 - dogDeathProgress * 0.45
								dogYOffset += dogDeathProgress * 18
							}
							drawSprite(sprite, screenX, dogHeight, sprite.dying ? "#6b7280" : "#a16207", dogYOffset)
						} else {
							var palette = sprite.kind === "elite"
								? {
									head: "#fde68a",
									body: "#f97316",
									arm: "#fdba74",
									leg: "#7c2d12",
									weapon: "#e5e7eb"
								}
								: {
									head: "#f1d2b1",
									body: "#cbd5e1",
									arm: "#f1d2b1",
									leg: "#475569",
									weapon: "#93c5fd"
								}
							if (sprite.dying) {
								var deathProgress = 1 - Math.max(0, sprite.deathTimer) / 0.6
								drawSprite(
									sprite,
									screenX,
									spriteHeight * (0.38 - deathProgress * 0.08),
									"#6b7280",
									spriteHeight * (0.34 + deathProgress * 22)
								)
							} else {
								drawHumanoidSprite(sprite, screenX, spriteHeight * 0.86, palette)
							}
						}
					} else if (sprite.type === "ammo") {
						drawSprite(sprite, screenX, spriteHeight * 0.34, "#60a5fa", spriteHeight * 0.2)
					} else if (sprite.type === "med") {
						drawSprite(sprite, screenX, spriteHeight * 0.34, "#22c55e", spriteHeight * 0.2)
					} else if (sprite.type === "key") {
						drawSprite(sprite, screenX, spriteHeight * 0.34, "#facc15", spriteHeight * 0.2)
					}
				}
			}

			function renderDamagePopups() {
				for (var i = 0; i < damagePopups.length; i++) {
					var popup = damagePopups[i]
					var spriteX = popup.x - player.x
					var spriteY = popup.y - player.y
					var invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY)
					var transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY)
					var transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY)
					if (transformY <= 0.1) continue

					var screenX = Math.floor((width / 2) * (1 + transformX / transformY))
					var rise = (1 - Math.max(0, popup.life) / 0.8) * 24
					var screenY = Math.floor(height / 2 - (height / transformY) * 0.55 - rise)
					var alpha = Math.max(0, Math.min(1, popup.life / 0.8))

					ctx.fillStyle = "rgba(248, 113, 113, " + alpha + ")"
					ctx.strokeStyle = "rgba(15, 23, 42, " + Math.min(1, alpha + 0.15) + ")"
					ctx.lineWidth = 3
					ctx.font = "bold 18px Consolas, monospace"
					ctx.textAlign = "center"
					ctx.strokeText("-" + popup.value, screenX, screenY)
					ctx.fillText("-" + popup.value, screenX, screenY)
				}
				ctx.textAlign = "start"
			}

			function renderMinimap() {
				var scale = 8
				var originX = width - map[0].length * scale - 12
				var originY = 12
				ctx.fillStyle = "rgba(5,10,15,0.72)"
				ctx.fillRect(originX - 4, originY - 4, map[0].length * scale + 8, map.length * scale + 8)

				for (var y = 0; y < map.length; y++) {
					for (var x = 0; x < map[y].length; x++) {
						var tile = map[y][x]
						ctx.fillStyle = tile > 0 ? (tile === 5 ? "#eab308" : "#334155") : "#0f172a"
						ctx.fillRect(originX + x * scale, originY + y * scale, scale - 1, scale - 1)
					}
				}

				for (var p = 0; p < pickups.length; p++) {
					if (!pickups[p].active) continue
					ctx.fillStyle = pickups[p].type === "key" ? "#fde047" : (pickups[p].type === "med" ? "#22c55e" : "#60a5fa")
					ctx.fillRect(originX + pickups[p].x * scale - 2, originY + pickups[p].y * scale - 2, 4, 4)
				}

				for (var i = 0; i < enemies.length; i++) {
					if (!enemies[i].alive) continue
					ctx.fillStyle = "#ef4444"
					ctx.fillRect(originX + enemies[i].x * scale - 2, originY + enemies[i].y * scale - 2, 4, 4)
				}

				ctx.fillStyle = "#ffffff"
				ctx.beginPath()
				ctx.arc(originX + player.x * scale, originY + player.y * scale, 3, 0, Math.PI * 2)
				ctx.fill()
				ctx.strokeStyle = "#93c5fd"
				ctx.beginPath()
				ctx.moveTo(originX + player.x * scale, originY + player.y * scale)
				ctx.lineTo(originX + (player.x + player.dirX * 1.2) * scale, originY + (player.y + player.dirY * 1.2) * scale)
				ctx.stroke()
			}

			function renderWeaponAndHud() {
				ctx.fillStyle = "rgba(8,12,16,0.7)"
				ctx.fillRect(0, height - 48, width, 48)
				ctx.fillStyle = "#dbeafe"
				ctx.font = "bold 14px Consolas, monospace"
				ctx.fillText("HP " + Math.max(0, Math.round(player.health)), 14, height - 20)
				ctx.fillText("AMMO " + player.ammo, 110, height - 20)
				ctx.fillText("FOES " + enemies.filter(function (enemy) { return enemy.alive }).length, 225, height - 20)
				ctx.fillText(player.hasKey ? "KEY ACQUIRED" : "KEY MISSING", 320, height - 20)

				ctx.strokeStyle = "rgba(255,255,255,0.28)"
				ctx.beginPath()
				ctx.moveTo(width / 2 - 8, height / 2)
				ctx.lineTo(width / 2 + 8, height / 2)
				ctx.moveTo(width / 2, height / 2 - 8)
				ctx.lineTo(width / 2, height / 2 + 8)
				ctx.stroke()

				ctx.fillStyle = shootCooldown > 0.2 ? "#e2e8f0" : "#94a3b8"
				ctx.fillRect(width / 2 - 28, height - 72, 56, 24)
				ctx.fillStyle = "#0f172a"
				ctx.fillRect(width / 2 - 8, height - 84, 16, 16)
				if (muzzleFlash > 0) {
					ctx.fillStyle = "rgba(251, 191, 36, " + Math.min(0.35, muzzleFlash * 3.5) + ")"
					ctx.beginPath()
					ctx.moveTo(width / 2 - 6, height - 84)
					ctx.lineTo(width / 2 + 18, height - 110)
					ctx.lineTo(width / 2 + 8, height - 76)
					ctx.closePath()
					ctx.fill()
					ctx.fillStyle = "rgba(255,255,255," + Math.min(0.28, muzzleFlash * 2.8) + ")"
					ctx.fillRect(0, 0, width, height * 0.16)
				}
				if (player.hitFlash > 0) {
					ctx.fillStyle = "rgba(239,68,68," + Math.min(0.28, player.hitFlash * 1.2) + ")"
					ctx.fillRect(0, 0, width, height)
				}
				if (gameWon || gameOver) {
					ctx.fillStyle = "rgba(3,6,9,0.78)"
					ctx.fillRect(0, 0, width, height)
					ctx.fillStyle = gameWon ? "#86efac" : "#fca5a5"
					ctx.font = "bold 28px Consolas, monospace"
					ctx.fillText(gameWon ? "MISSION COMPLETE" : "SIMULATION FAILED", 170, 180)
					ctx.fillStyle = "#dbeafe"
					ctx.font = "14px Consolas, monospace"
					ctx.fillText(
						gameWon
							? (props.isFinalLevel ? "Press Enter to finish or R to replay" : "Press Enter for next sector or R to replay")
							: "Press R to retry or X to exit",
						110,
						220
					)
				}
			}

			function renderFrame() {
				ctx.clearRect(0, 0, width, height)
				ctx.fillStyle = "#212833"
				ctx.fillRect(0, 0, width, height / 2)
				ctx.fillStyle = "#3a3126"
				ctx.fillRect(0, height / 2, width, height / 2)

				for (var x = 0; x < width; x++) {
					var cameraX = 2 * x / width - 1
					var rayDirX = player.dirX + player.planeX * cameraX
					var rayDirY = player.dirY + player.planeY * cameraX

					var mapX = Math.floor(player.x)
					var mapY = Math.floor(player.y)

					var deltaDistX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX)
					var deltaDistY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY)
					var stepX
					var stepY
					var sideDistX
					var sideDistY
					var hit = 0
					var side = 0

					if (rayDirX < 0) {
						stepX = -1
						sideDistX = (player.x - mapX) * deltaDistX
					} else {
						stepX = 1
						sideDistX = (mapX + 1 - player.x) * deltaDistX
					}

					if (rayDirY < 0) {
						stepY = -1
						sideDistY = (player.y - mapY) * deltaDistY
					} else {
						stepY = 1
						sideDistY = (mapY + 1 - player.y) * deltaDistY
					}

					while (hit === 0) {
						if (sideDistX < sideDistY) {
							sideDistX += deltaDistX
							mapX += stepX
							side = 0
						} else {
							sideDistY += deltaDistY
							mapY += stepY
							side = 1
						}
						if (map[mapY][mapX] > 0) {
							hit = map[mapY][mapX]
						}
					}

					var perpWallDist
					if (side === 0) {
						perpWallDist = (mapX - player.x + (1 - stepX) / 2) / rayDirX
					} else {
						perpWallDist = (mapY - player.y + (1 - stepY) / 2) / rayDirY
					}

					var lineHeight = Math.floor(height / Math.max(perpWallDist, 0.001))
					var drawStart = Math.max(0, Math.floor(-lineHeight / 2 + height / 2))
					var drawEnd = Math.min(height - 1, Math.floor(lineHeight / 2 + height / 2))

					drawVerticalLine(x, drawStart, drawEnd, hit, side === 1)
					zBuffer[x] = perpWallDist
				}

				ctx.strokeStyle = "rgba(255,255,255,0.06)"
				for (var i = 0; i < height; i += 4) {
					ctx.beginPath()
					ctx.moveTo(0, i + 0.5)
					ctx.lineTo(width, i + 0.5)
					ctx.stroke()
				}

				renderSprites()
				renderMinimap()
				renderWeaponAndHud()
			}

			function frame(now) {
				var delta = Math.min((now - lastTime) / 1000, 0.05)
				lastTime = now
				if (!gameWon && !gameOver) {
					updatePlayer(delta)
					updateEnemies(delta)
				}
				updateDamagePopups(delta)
				hudTimer += delta
				if (hudTimer > 0.15) {
					hudTimer = 0
					setHud({
						health: Math.max(0, Math.round(player.health)),
						ammo: player.ammo,
						enemies: enemies.filter(function (enemy) { return enemy.alive }).length,
						status: gameWon
							? (props.isFinalLevel ? "Campaign complete." : "Sector clear. Proceed to next level.")
							: (gameOver ? "Simulation failed." : (player.hasKey ? "Exit unlocked." : "Find the key and clear hostiles."))
					})
				}
				renderFrame()
				renderDamagePopups()
				animationId = window.requestAnimationFrame(frame)
			}

			function onKeyDown(event) {
				keys[event.code] = true
				if (event.code === "Escape") {
					event.preventDefault()
					props.onClose()
					return
				}
				if (event.code === "Enter" && gameWon) {
					event.preventDefault()
					if (props.onAdvance) {
						props.onAdvance()
					}
					return
				}
				if (event.code === "KeyR" && (gameWon || gameOver)) {
					props.onRestart()
				}
				if (event.code === "Space") {
					tryShoot()
				}
				if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowLeft", "ArrowRight", "Space"].indexOf(event.code) !== -1) {
					event.preventDefault()
				}
			}

			function onKeyUp(event) {
				keys[event.code] = false
			}

			window.addEventListener("keydown", onKeyDown)
			window.addEventListener("keyup", onKeyUp)
			animationId = window.requestAnimationFrame(frame)

			return function () {
				window.cancelAnimationFrame(animationId)
				window.removeEventListener("keydown", onKeyDown)
				window.removeEventListener("keyup", onKeyUp)
			}
		}, [props.levelIndex, props.isFinalLevel])

		return h("div", {
			style: {
				background: "#151b23",
				border: "1px solid #374151",
				display: "flex",
				flexDirection: "column",
				gap: "10px",
				padding: "10px"
			}
		},
			h("div", {
				style: {
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: "10px",
					paddingBottom: "8px",
					borderBottom: "1px solid #374151"
				}
			},
				h("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: "10px"
					}
				},
					h("div", {
						style: {
							width: "26px",
							height: "26px",
							border: "1px solid #5f7c9e",
							background: "linear-gradient(180deg,#4d6d90 0%,#324860 100%)",
							color: "#fff",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "13px",
							fontWeight: "700"
						}
					}, "E"),
					h("div", null,
						h("div", {
							style: {
								color: "#f8fafc",
								fontSize: "13px",
								fontWeight: "700"
							}
						}, "Retro.exe - Raycaster Engine"),
						h("div", {
							style: {
								marginTop: "2px",
								color: "#94a3b8",
								fontSize: "10px"
							}
						}, "Sector " + String((props.levelIndex || 0) + 1) + "/" + String(WOLF_LEVELS.length) + " | WASD move | Space shoot | Enter proceed")
					)
				),
				h("button", {
					type: "button",
					onClick: props.onClose,
					style: {
						minWidth: "32px",
						height: "28px",
						border: "1px solid #7c4747",
						background: "transparent",
						color: "#cbd5e1",
						cursor: "pointer",
						fontWeight: "700"
					}
				}, "X")
			),
			h("div", {
				style: {
					display: "flex",
					justifyContent: "space-between",
					gap: "8px"
				}
			},
				h("div", {
					style: {
						color: "#94a3b8",
						fontSize: "10px",
						textTransform: "uppercase",
						letterSpacing: "0.08em",
						alignSelf: "center"
					}
				}, level.name + " - " + level.status),
				h("div", {
					style: {
						display: "flex",
						gap: "8px"
					}
				},
					h("button", {
						type: "button",
						onClick: props.onClose,
						style: {
							minWidth: "88px",
							height: "28px",
							border: "1px solid #475569",
							background: "transparent",
							color: "#cbd5e1",
							cursor: "pointer",
							fontSize: "11px",
							fontWeight: "700",
							textTransform: "uppercase"
						}
					}, "Exit")
				)
			),
			h("div", {
				style: {
					display: "flex",
					justifyContent: "center"
				}
			},
				h("canvas", {
					ref: canvasRef,
					width: 640,
					height: 400,
					style: {
						display: "block",
						border: "1px solid #475569",
						background: "#000000",
						boxShadow: "0 0 0 1px rgba(148,163,184,0.08), inset 0 0 24px rgba(0,0,0,0.42)"
					}
				})
			),
			h("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
					gap: "8px"
				}
			},
				h("div", { style: { border: "1px solid #334155", padding: "8px", background: "#10161d" } },
					h("div", { style: { color: "#7c8a9d", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em" } }, "Health"),
					h("div", { style: { marginTop: "3px", color: "#f8fafc", fontSize: "14px", fontWeight: "700" } }, String(hud.health))
				),
				h("div", { style: { border: "1px solid #334155", padding: "8px", background: "#10161d" } },
					h("div", { style: { color: "#7c8a9d", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em" } }, "Ammo"),
					h("div", { style: { marginTop: "3px", color: "#f8fafc", fontSize: "14px", fontWeight: "700" } }, String(hud.ammo))
				),
				h("div", { style: { border: "1px solid #334155", padding: "8px", background: "#10161d" } },
					h("div", { style: { color: "#7c8a9d", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em" } }, "Enemies"),
					h("div", { style: { marginTop: "3px", color: "#f8fafc", fontSize: "14px", fontWeight: "700" } }, String(hud.enemies))
				),
				h("div", { style: { border: "1px solid #334155", padding: "8px", background: "#10161d" } },
					h("div", { style: { color: "#7c8a9d", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em" } }, "Objective"),
					h("div", { style: { marginTop: "3px", color: "#f8fafc", fontSize: "11px", fontWeight: "700", lineHeight: "13px" } }, hud.status)
				)
			),
			h("div", {
				style: {
					color: "#94a3b8",
					fontSize: "10px",
					textAlign: "center",
					letterSpacing: "0.08em",
					textTransform: "uppercase"
				}
			}, "Hidden build unlocked via secret code: " + CHEAT_CODE)
		)
	}

	function ArcadeClassic() {
		var backend = useBackend()
		var data = backend.data || {}
		var act = backend.act
		var gameover = !!data.gameover
		var emulatorState = useState(false)
		var emulatorOpen = emulatorState[0]
		var setEmulatorOpen = emulatorState[1]
		var levelState = useState(0)
		var levelIndex = levelState[0]
		var setLevelIndex = levelState[1]
		var cheatBufferRef = useRef("")

		useEffect(function () {
			function onKeyDown(event) {
				var target = event.target
				if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
					return
				}

				var key = ""
				if (event.key) {
					key = String(event.key).toUpperCase()
				} else {
					var code = event.which || event.keyCode || 0
					if (code >= 48 && code <= 57) {
						key = String.fromCharCode(code)
					} else if (code >= 65 && code <= 90) {
						key = String.fromCharCode(code)
					}
				}
				if (!key || key.length !== 1) {
					return
				}

				cheatBufferRef.current = (cheatBufferRef.current + key).slice(-CHEAT_CODE.length)
				if (cheatBufferRef.current === CHEAT_CODE) {
					setLevelIndex(0)
					setEmulatorOpen(true)
					cheatBufferRef.current = ""
				}
			}

			document.addEventListener("keydown", onKeyDown, true)
			return function () {
				document.removeEventListener("keydown", onKeyDown, true)
			}
		}, [])

		if (emulatorOpen) {
			return h(RetroEmulator, {
				levelIndex: levelIndex,
				isFinalLevel: levelIndex >= WOLF_LEVELS.length - 1,
				onClose: function () { setEmulatorOpen(false) },
				onRestart: function () { setEmulatorOpen(false); window.setTimeout(function () { setEmulatorOpen(true) }, 0) },
				onAdvance: function () {
					if (levelIndex >= WOLF_LEVELS.length - 1) {
						setLevelIndex(0)
						setEmulatorOpen(false)
						return
					}
					setLevelIndex(levelIndex + 1)
				}
			})
		}

		return h(SUI.Stack, { vertical: true, gap: "8px", fill: true },
			StatePanel ? h(StatePanel, {
				eyebrow: "Hidden Build",
				title: "Secret code available",
				message: "Type " + CHEAT_CODE + " anywhere in this arcade window to boot the experimental retro emulator.",
				compact: true
			}) : null,
			h(SUI.Section, { title: "Battle Feed" },
				h(SUI.NoticeBox, { danger: gameover }, data.information || "A new game has started!"),
				h("div", { style: { marginTop: "8px" } },
					h(SUI.Button, { icon: "refresh", onClick: function () { act("new_game") } }, "New Game")
				)
			),
			h(SUI.Stack, { gap: "8px", wrap: true, fill: true },
				h(SUI.Stack.Item, { grow: true },
					h(StatCard, {
						title: "Player",
						health: data.player_health,
						mana: data.player_mana,
						maxHealth: 30,
						maxMana: 20
					})
				),
				h(SUI.Stack.Item, { grow: true },
					h(StatCard, {
						title: data.enemy_name || "Enemy",
						health: data.enemy_health,
						mana: data.enemy_mana,
						maxHealth: 45,
						maxMana: 20
					})
				)
			),
			h(SUI.Section, { title: "Actions" },
				h(SUI.Stack, { gap: "8px", wrap: true },
					h(SUI.Button, {
						icon: "target",
						disabled: gameover,
						onClick: function () { act("attack") }
					}, "Attack"),
					h(SUI.Button, {
						icon: "heart",
						disabled: gameover,
						onClick: function () { act("heal") }
					}, "Heal"),
					h(SUI.Button, {
						icon: "bolt",
						disabled: gameover,
						onClick: function () { act("regain_mana") }
					}, "Regain Energy")
				)
			)
		)
	}

	SUI.registerInterface("ArcadeClassic", ArcadeClassic)
})()
