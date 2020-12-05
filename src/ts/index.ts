"use strict"
// default option
let startWidth = 960,
	startHeight = 536,
	scale =
		window.innerWidth < startWidth
			? Math.min(
					window.innerWidth / startWidth,
					window.innerHeight / startHeight
			  )
			: 1,
	width = startWidth * scale,
	height = startHeight * scale,
	buttonSize = 90 * scale
// spine icon size
const REEL_WIDTH = width / 6
const SYMBOL_SIZE = REEL_WIDTH - 10
//// app options
let running = false
const reels: any[] = []
const tweening: any[] = []

interface User {
	balanse?: number
}

class Application {
	private app: PIXI.Application
	private button: SpinButton
	private backgroundContainer: PIXI.Container
	private gameContainer: PIXI.Container
	private popupContainer: PIXI.Container
	private spinList: number[]
	private balanseText: PIXI.Text
	private user: User
	constructor() {
		this.spinList = []
		this.user = {}
		this.app = new PIXI.Application(width, height, {
			transparent: false,
			backgroundColor: 0x1099bb,
			autoResize: true,
			resolution: 1,
		})
		this.backgroundContainer = new PIXI.Container()
		this.gameContainer = new PIXI.Container()

		this.button = new SpinButton()
		this.button.on("pointerdown", this.startPlay, this)
	}
	// Reels done handler.
	reelsComplete(): void {
		running = false
	}
	fetchData():void {
		fetch("./js/data.json")
		.then((res) => res.json())
		.then(({spins, user}) => {
				console.log("Spins and user info was loaded")
				this.popupContainer.destroy()
				this.spinList = spins[Math.floor(Math.random() * spins.length)]
				this.user = user
			})
			.catch(() => {
				document.body.innerHTML = `<h1 style="text-align:center;">Something wrong</h1>`
			})
	}
	start(): void {
		const wrap = document.createElement("main")
		wrap.appendChild(this.app.view)
		document.body.appendChild(wrap)
		this.initPopupContainer(`Loading`)
		this.fetchData()

		PIXI.loader
			.add("bg", "../images/BG.png")
			.add("1", "../images/spins/1.png")
			.add("2", "../images/spins/2.png")
			.add("3", "../images/spins/3.png")
			.add("4", "../images/spins/4.png")
			.add("5", "../images/spins/5.png")
			.add("6", "../images/spins/6.png")
			.load(this.init.bind(this))
	}
	// init handler builds the example.
	init(): void {
		// Create different slot symbols.
		const slotTextures = [
			PIXI.Texture.from("1"),
			PIXI.Texture.from("2"),
			PIXI.Texture.from("3"),
			PIXI.Texture.from("4"),
			PIXI.Texture.from("5"),
			PIXI.Texture.from("6"),
		]

		this.initBasicSkin()
		this.initButton()
		this.renderUserInfo()

		this.buildReels(slotTextures)

		this.app.stage.addChild(this.gameContainer)

		this.gameContainer.y = buttonSize / 4
		this.gameContainer.x = 120 * scale

		// Listen for animate update.
		this.app.ticker.add((delta) => {
			// Update the slots.
			for (let i = 0; i < reels.length; i++) {
				const r = reels[i]
				// Update blur filter y amount based on speed.
				// This would be better if calculated with time in mind also. Now blur depends on frame rate.
				r.blur.blurY = (r.position - r.previousPosition) * 8
				r.previousPosition = r.position

				// Update symbol positions on reel.
				for (let j = 0; j < r.symbols.length; j++) {
					const s = r.symbols[j]
					const prevy = s.y
					s.y =
						((r.position + j) % r.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE
					if (s.y < 0 && prevy > SYMBOL_SIZE) {
						// Detect going over and swap a texture.
						// This should in proper product be determined from some logical reel.

						s.texture =
						slotTextures[Math.floor(Math.random() * slotTextures.length)]
						s.scale.x = s.scale.y = Math.min(
							SYMBOL_SIZE / s.texture.width,
							SYMBOL_SIZE / s.texture.height
						)
						s.x = Math.round((SYMBOL_SIZE - s.width) / 2)
					}
				}
			}
		})
		// Listen for animate update.
		this.app.ticker.add((delta) => {
			const now = Date.now()
			const remove = []
			for (let i = 0; i < tweening.length; i++) {
				const t = tweening[i]
				const phase = Math.min(1, (now - t.start) / t.time)

				t.object[t.property] = lerp(
					t.propertyBeginValue,
					t.target,
					t.easing(phase)
				)
				if (t.change) t.change(t)
				if (phase === 1) {
					t.object[t.property] = t.target
					if (t.complete) t.complete(t)
					remove.push(t)
				}
			}
			for (let i = 0; i < remove.length; i++) {
				tweening.splice(tweening.indexOf(remove[i]), 1)
			}
		})
	}
	// Build the reels
	buildReels(slotTextures: PIXI.Texture[]): void {
		for (let i = 0; i < 3; i++) {
			const rc = new PIXI.Container()
			rc.x = i * REEL_WIDTH * 1.5
			this.gameContainer.addChild(rc)

			let symbols: PIXI.Sprite[] = []
			const reel = {
				container: rc,
				position: 0,
				symbols,
				previousPosition: 0,
				blur: new PIXI.filters.BlurFilter(),
			}
			reel.blur.blurX = 0
			reel.blur.blurY = 0
			rc.filters = [reel.blur]

			// Build the symbols
			for (let j = 0; j < 4; j++) {
				const symbol: PIXI.Sprite = new PIXI.Sprite(
					slotTextures[Math.floor(Math.random() * slotTextures.length)]
				)
				// Scale the symbol to fit symbol area.
				symbol.y = j * SYMBOL_SIZE
				symbol.scale.x = symbol.scale.y = Math.min(
					SYMBOL_SIZE / symbol.width,
					SYMBOL_SIZE / symbol.height
				)
				symbol.x = Math.round((SYMBOL_SIZE - symbol.width) / 2)
				reel.symbols.push(symbol)
				rc.addChild(symbol)
			}
			reels.push(reel)
		}
	}
	initButton(): void {
		this.button.width = buttonSize
		this.button.height = buttonSize
		this.button.x = width - this.button.width - this.button.width / 2
		this.button.y =
			(height / 2 - this.button.height / 2)
		this.backgroundContainer.addChild(this.button)
	}
	initPopupContainer(textValue:string): void {
		const popupContainer = new PIXI.Container()

		const graph = new PIXI.Graphics()
		graph.beginFill(0, 0.7)
		graph.lineStyle(0, 0xffffff, 1)
		graph.drawRect(0, 0, this.app.screen.width, this.app.screen.height)

		const style = new PIXI.TextStyle({
			fontFamily: "Arial",
			fontSize: 36,
			fontWeight: "bold",
			fill: ["#ffffff", "#f44336"], // gradient
			wordWrap: true,
			wordWrapWidth: 440,
		})

		// Add text
		const text = new PIXI.Text(textValue, style)
		text.x = Math.round(graph.width - text.width) / 2
		text.y =  Math.round(graph.height - text.height) / 2

		graph.addChild(text)
		popupContainer.addChild(graph)
		this.popupContainer = popupContainer
		this.app.stage.addChild(popupContainer)
	}
	renderUserInfo(): void {
		if (!this.user.hasOwnProperty("balanse")) return
		this.balanseText?.destroy({texture: true})
		const style = new PIXI.TextStyle({
			fontFamily: "Arial",
			fontSize: 14,
			fontStyle: "italic",
			fontWeight: "bold",
			fill: ["#ffffff", "#00ff99"], // gradient
			stroke: "#4a1850",
			strokeThickness: 5,
			dropShadow: true,
			dropShadowColor: "#000000",
			dropShadowBlur: 4,
			dropShadowAngle: Math.PI / 6,
			dropShadowDistance: 6,
			wordWrap: true,
			wordWrapWidth: 440,
		})

		const balanse = new PIXI.Text(`Balanse: ${this.user.balanse}`, style)
		balanse.x = Math.round(width - balanse.width)
		balanse.y = 10

		this.balanseText = balanse
		this.backgroundContainer.addChild(balanse)
	}
	initBasicSkin(): void {
		const bg = PIXI.Texture.from("bg")
		const bgSprite = new PIXI.Sprite(bg)

		bgSprite.width = this.app.screen.width
		bgSprite.height = this.app.screen.height
		bgSprite.x = 0
		bgSprite.y = 0
		this.backgroundContainer.addChild(bgSprite)
		this.app.stage.addChild(this.backgroundContainer)
	}
	// Function to start playing.
	startPlay(): void {
		if (this.user.balanse - 5 < 0) {
			this.initPopupContainer(`Game over`)
			return
		}
		this.spendMoney()
		this.createAnimations()
		this.renderUserInfo()
		setTimeout(() => {
			this.button.toggleButton()
		}, 4500)
	}
	createAnimations(): void {
		if (running) return
		running = true

		for (let i = 0; i < reels.length; i++) {
			const r = reels[i]
			const extra = Math.floor(Math.random() * 3)
			const target = r.position + 10 + i * 5 + extra
			const time = 2500 + i * 600 + extra * 600

			this.tweenTo(
				r,
				"position",
				target,
				time,
				backout(0.5),
				null,
				i === reels.length - 1 ? this.reelsComplete : null
			)
		}
	}
	spendMoney(): void {
		this.user.balanse = this.user.balanse - 5
	}
	tweenTo(
		object: any,
		property: string,
		target: number,
		time: number,
		easing: object,
		onchange: null,
		oncomplete: null | any
	) {
		const tween = {
			object,
			property,
			propertyBeginValue: object[property],
			target,
			easing,
			time,
			change: onchange,
			complete: oncomplete,
			start: Date.now(),
		}

		tweening.push(tween)
		return tween
	}
}

class SpinButton extends PIXI.Sprite {
	private textureButton: PIXI.Texture
	private textureButtonDisable: PIXI.Texture

	constructor() {
		const textureButton = PIXI.Texture.from("../images/button.png")
		super(textureButton)
		this.textureButton = textureButton
		this.textureButtonDisable = PIXI.Texture.from("../images/button_d.png")
		this.interactive = true
		this.buttonMode = true

		this.on("pointerdown", this.toggleButton)
	}

	public toggleButton(): void {
		if (this.interactive) {
			this.texture = this.textureButtonDisable
		} else {
			this.texture = this.textureButton
		}
		this.interactive = !this.interactive
	}
}

// Basic lerp funtion.

function lerp(a1: number, a2: number, t: number): number {
	return a1 * (1 - t) + a2 * t
}

// Backout function from tweenjs.
// https://github.com/CreateJS/TweenJS/blob/master/src/tweenjs/Ease.js
function backout(amount: number) {
	return (t: any) => --t * t * ((amount + 1) * t + amount) + 1
}

const newGame = new Application()
newGame.start()
