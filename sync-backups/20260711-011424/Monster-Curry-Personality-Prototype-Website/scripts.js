import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
	getFirestore,
	collection,
	addDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* ---------------- FIREBASE ---------------- */
const firebaseConfig = {
	apiKey: "AIzaSyC1lCGw5eI3oFxw9_FKxBp86k1cMPGWbic",
	authDomain: "monstercurryfeedback.firebaseapp.com",
	projectId: "monstercurryfeedback",
	storageBucket: "monstercurryfeedback.appspot.com",
	messagingSenderId: "881609695456",
	appId: "1:881609695456:web:b84a60ed669112d937b085"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ---------------- QUIZ DATA ---------------- */
// Scoring: each option awards points to specific personalities.
// +3 = strong match, +1 = similar, -1 = opposite
const P = {
	katsu:    "katsu",
	monstora: "monstora",
	giga:     "giga",
	tamago:   "tamago",
	cheezu:   "cheezu",
	ramy:     "ramy",
	hotsizz:  "hotsizz",
	teppa:    "teppa"
};

const questions = [
{
		prompt: "I always want extra toppings on my curry.",
		options: [
			{ text: "More toppings = better life",  scores: { [P.giga]: 3, [P.monstora]: 1, [P.hotsizz]: 1, [P.teppa]: -1 } },
			{ text: "Simple is enough",             scores: { [P.katsu]: 3, [P.tamago]: 1, [P.teppa]: 1, [P.hotsizz]: -1 } },
			{ text: "Depends on mood",              scores: { [P.ramy]: 3, [P.teppa]: 1, [P.hotsizz]: 1, [P.monstora]: -1 } },
			{ text: "Only exciting toppings",       scores: { [P.hotsizz]: 3, [P.giga]: 1, [P.ramy]: 1, [P.katsu]: -1 } }
		]
	},
	{
		prompt: "Spicy food makes meals more exciting.",
		options: [
			{ text: "Extra spicy please",    scores: { [P.hotsizz]: 3, [P.giga]: 1, [P.ramy]: 1, [P.katsu]: -1 } },
			{ text: "Medium spice is enough", scores: { [P.teppa]: 3, [P.katsu]: 1, [P.ramy]: 1, [P.giga]: -1 } },
			{ text: "Mild only",             scores: { [P.cheezu]: 3, [P.monstora]: 1, [P.tamago]: 1 } },
			{ text: "No spice at all",       scores: { [P.tamago]: 3, [P.katsu]: 1, [P.cheezu]: 1 } }
		]
	},
	{
		prompt: "I usually order the same safe menu item.",
		options: [
			{ text: "I stay loyal to favorites", scores: { [P.katsu]: 3, [P.tamago]: 1, [P.teppa]: 1, [P.hotsizz]: -1 } },
			{ text: "I love trying new dishes",  scores: { [P.hotsizz]: 3, [P.giga]: 1, [P.ramy]: 1, [P.katsu]: -1 } },
			{ text: "Depends on my mood",        scores: { [P.ramy]: 3, [P.teppa]: 1, [P.hotsizz]: 1, [P.monstora]: -1 } },
			{ text: "Friends decide for me",     scores: { [P.monstora]: 3, [P.giga]: 1, [P.cheezu]: 1, [P.ramy]: -1 } }
		]
	},
	{
		prompt: "Food presentation matters as much as taste.",
		options: [
			{ text: "Looks are everything",    scores: { [P.teppa]: 3, [P.katsu]: 1, [P.ramy]: 1, [P.giga]: -1 } },
			{ text: "Taste is more important", scores: { [P.giga]: 3, [P.monstora]: 1, [P.hotsizz]: 1, [P.teppa]: -1 } },
			{ text: "Both matter",             scores: { [P.monstora]: 3, [P.giga]: 1, [P.cheezu]: 1, [P.ramy]: -1 } },
			{ text: "I want comfort food",     scores: { [P.tamago]: 3, [P.katsu]: 1, [P.cheezu]: 1 } }
		]
	},
	{
		prompt: "I would try the giant Monster Challenge curry.",
		options: [
			{ text: "Definitely",               scores: { [P.giga]: 3, [P.monstora]: 1, [P.hotsizz]: 1, [P.teppa]: -1 } },
			{ text: "Maybe with friends",        scores: { [P.monstora]: 3, [P.giga]: 1, [P.cheezu]: 1, [P.ramy]: -1 } },
			{ text: "Probably not",              scores: { [P.tamago]: 3, [P.katsu]: 1, [P.cheezu]: 1 } },
			{ text: "Only if there's a reward",  scores: { [P.teppa]: 3, [P.katsu]: 1, [P.ramy]: 1, [P.giga]: -1 } }
		]
	},
	{
		prompt: "Cheese makes every dish better.",
		options: [
			{ text: "Cheese solves everything", scores: { [P.cheezu]: 3, [P.monstora]: 1, [P.tamago]: 1 } },
			{ text: "Sometimes yes",            scores: { [P.katsu]: 3, [P.tamago]: 1, [P.teppa]: 1, [P.hotsizz]: -1 } },
			{ text: "Not necessary",            scores: { [P.teppa]: 3, [P.katsu]: 1, [P.ramy]: 1, [P.giga]: -1 } },
			{ text: "I prefer strong flavors",  scores: { [P.hotsizz]: 3, [P.giga]: 1, [P.ramy]: 1, [P.katsu]: -1 } }
		]
	},
	{
		prompt: "I choose food based on comfort, not adventure.",
		options: [
			{ text: "Comfort food forever", scores: { [P.tamago]: 3, [P.katsu]: 1, [P.cheezu]: 1 } },
			{ text: "Usually comfort food", scores: { [P.katsu]: 3, [P.tamago]: 1, [P.teppa]: 1, [P.hotsizz]: -1 } },
			{ text: "I like both",          scores: { [P.ramy]: 3, [P.teppa]: 1, [P.hotsizz]: 1, [P.monstora]: -1 } },
			{ text: "Adventure first",      scores: { [P.hotsizz]: 3, [P.giga]: 1, [P.ramy]: 1, [P.katsu]: -1 } }
		]
	},
	{
		prompt: "I like sharing food with friends.",
		options: [
			{ text: "Sharing is caring", scores: { [P.monstora]: 3, [P.giga]: 1, [P.cheezu]: 1, [P.ramy]: -1 } },
			{ text: "Depends who",       scores: { [P.cheezu]: 3, [P.monstora]: 1, [P.tamago]: 1 } },
			{ text: "Maybe one bite",    scores: { [P.katsu]: 3, [P.tamago]: 1, [P.teppa]: 1, [P.hotsizz]: -1 } },
			{ text: "My food is mine",   scores: { [P.ramy]: 3, [P.teppa]: 1, [P.hotsizz]: 1, [P.monstora]: -1 } }
		]
	},
	{
		prompt: "I prefer a balanced meal over a heavy meal.",
		options: [
			{ text: "Healthy and balanced",  scores: { [P.teppa]: 3, [P.katsu]: 1, [P.ramy]: 1, [P.giga]: -1 } },
			{ text: "Balance with some fun", scores: { [P.katsu]: 3, [P.tamago]: 1, [P.teppa]: 1, [P.hotsizz]: -1 } },
			{ text: "Heavy meals are best",  scores: { [P.giga]: 3, [P.monstora]: 1, [P.hotsizz]: 1, [P.teppa]: -1 } },
			{ text: "Depends on hunger",     scores: { [P.ramy]: 3, [P.teppa]: 1, [P.hotsizz]: 1, [P.monstora]: -1 } }
		]
	},
	{
		prompt: "I would post my Monster Curry meal on Instagram.",
		options: [
			{ text: "Of course",               scores: { [P.hotsizz]: 3, [P.giga]: 1, [P.ramy]: 1, [P.katsu]: -1 } },
			{ text: "Only if it looks amazing", scores: { [P.teppa]: 3, [P.katsu]: 1, [P.ramy]: 1, [P.giga]: -1 } },
			{ text: "Rarely",                  scores: { [P.monstora]: 3, [P.giga]: 1, [P.cheezu]: 1, [P.ramy]: -1 } },
			{ text: "Never",                   scores: { [P.ramy]: 3, [P.teppa]: 1, [P.hotsizz]: 1, [P.monstora]: -1 } }
		]
	},
	{
		prompt: "Which Monster Curry menu item speaks to you most?",
		options: [
			{ text: "Classic Chicken Katsu Curry",              scores: { katsu: 3, tamago: 1, teppa: 1, hotsizz: -1 } },
			{ text: "Monster Challenge (Extra Large)",           scores: { giga: 3, monstora: 1, hotsizz: 1, teppa: -1 } },
			{ text: "Cheese Curry with Extra Toppings",         scores: { cheezu: 3, monstora: 1, tamago: 1 } },
			{ text: "Spicy Hotplate Sizzling Curry",            scores: { hotsizz: 3, giga: 1, ramy: 1, katsu: -1 } }
		]
	},
	{
		prompt: "How do you like your curry sauce?",
		options: [
			{ text: "Rich and thick — the more the better",     scores: { giga: 3, monstora: 1, cheezu: 1, teppa: -1 } },
			{ text: "Smooth and balanced, not too heavy",       scores: { katsu: 3, tamago: 1, teppa: 1, hotsizz: -1 } },
			{ text: "Fiery and bold with a strong kick",        scores: { hotsizz: 3, giga: 1, ramy: 1, katsu: -1 } },
			{ text: "Light and flavourful — just enough",       scores: { ramy: 3, teppa: 1, hotsizz: 1, monstora: -1 } }
		]
	},
	{
		prompt: "What would you add first as an extra topping?",
		options: [
			{ text: "Melted cheese — always",                   scores: { cheezu: 3, monstora: 1, tamago: 1 } },
			{ text: "A perfectly fried egg",                    scores: { tamago: 3, katsu: 1, cheezu: 1 } },
			{ text: "Extra crispy katsu",                       scores: { katsu: 3, tamago: 1, teppa: 1, hotsizz: -1 } },
			{ text: "Extra chilli — make it hurt",              scores: { hotsizz: 3, giga: 1, ramy: 1, katsu: -1 } }
		]
	},
	{
		prompt: "You're eating at Monster Curry with friends. You:",
		options: [
			{ text: "Order the sharing Monster Combo platter",   scores: { monstora: 3, giga: 1, cheezu: 1, ramy: -1 } },
			{ text: "Get your personal favourite and focus",     scores: { katsu: 3, tamago: 1, teppa: 1, hotsizz: -1 } },
			{ text: "Try something new from the specials board", scores: { hotsizz: 3, giga: 1, ramy: 1, katsu: -1 } },
			{ text: "Let everyone order first, then decide",     scores: { ramy: 3, teppa: 1, hotsizz: 1, monstora: -1 } }
		]
	},
	{
		prompt: "Pick your ideal Monster Curry experience:",
		options: [
			{ text: "Teppanyaki-style — watching the chef cook live", scores: { teppa: 3, katsu: 1, ramy: 1, giga: -1 } },
			{ text: "Sizzling hotplate arriving at the table",         scores: { hotsizz: 3, giga: 1, ramy: 1, katsu: -1 } },
			{ text: "Giant bowl challenge with the whole group",       scores: { giga: 3, monstora: 1, hotsizz: 1, teppa: -1 } },
			{ text: "Quiet solo meal with a comforting classic",       scores: { tamago: 3, katsu: 1, cheezu: 1 } }
		]
	}
];

const personalities = [
	{
		id: P.katsu,
		image: "images/Katsu-Chan.png",
		name: "🍗 Katsu-Chan",
		title: "The Classic Comfort Hero",
		background: "Katsu-Chan is the heart of every meal — never flashy, but always satisfying. Just like a classic chicken katsu curry, they are the person everyone trusts when they don't know what to choose.",
		description: "Calm, comforting, and consistently good in any situation. You are reliable, friendly, and dependable. People gravitate toward you because you bring stability and warmth without making things complicated. You're everyone's safe choice — and that's a superpower."
	},
	{
		id: P.monstora,
		image: "images/Monstora_Sharemi.png",
		name: "🍛 Monstora Sharemi",
		title: "The Social Feast Buddy",
		background: "Monstora Sharemi believes food tastes better together. Always ordering the Monster Combo, they bring people to the table and make every meal feel like a party.",
		description: "Outgoing, generous, and group-oriented — you love sharing and bringing people together. If you're eating with someone, expect extra spoons and shared bites. You thrive in social settings and make everyone feel included in the fun."
	},
	{
		id: P.giga,
		image: "images/Giga_Nomu.png",
		name: "🍖 Giga Nomu",
		title: "The Big Appetite Beast",
		background: "Giga Nomu never leaves anything behind. The bigger the portion, the happier they are. Just like a super monster curry, they live life with huge energy and an even bigger appetite.",
		description: "Bold, energetic, and fearless — you live for big experiences and never hold back. You always finish what others can't, and your enthusiasm is contagious. You're built for full-throttle living, and people love your unstoppable energy."
	},
	{
		id: P.tamago,
		image: "images/Tamago_Puffy.png",
		name: "🥚 Tamago Puffy",
		title: "The Soft & Cozy Dreamer",
		background: "Tamago Puffy is soft on the outside and even softer inside. Warm, calming, and a little shy, they bring peace and sweetness wherever they go.",
		description: "Gentle, cute, and comfort-loving — you find joy in the quiet, cozy moments of life. You're the person who makes others feel instantly at ease. Your warmth is subtle but deeply felt, and your emotional softness is your greatest strength."
	},
	{
		id: P.cheezu,
		image: "images/Cheezu_Mellow.png",
		name: "🧀 Cheezu Mellow",
		title: "The Cheesy Comfort Lover",
		background: "Cheezu Mellow believes everything is better with cheese — especially life. Their presence melts stress away like cheese on hot curry.",
		description: "Affectionate, cozy, and a little over-the-top in the best way. You love indulgence and emotional warmth. You're expressive, caring, and impossible not to love. When you're around, people feel wrapped in something warm and good."
	},
	{
		id: P.ramy,
		image: "images/Ramy_Noodleton.png",
		name: "🍜 Ramy Noodleton",
		title: "The Chill Slurper",
		background: "Ramy Noodleton is the definition of chill. Always relaxed and enjoying noodle moments, they don't rush anything in life. Like a comforting ramen-curry fusion, they are smooth, soothing, and effortlessly likable.",
		description: "Relaxed, easygoing, and quietly cool — you go with the flow and never let life stress you out. You have a laid-back charm that draws people in. You know how to enjoy the moment without overcomplicating things."
	},
	{
		id: P.hotsizz,
		image: "images/Hot_Sizz.png",
		name: "🔥 Hot Sizz",
		title: "The Hotplate Performer",
		background: "Hot Sizz arrives with a literal sizzle. Just like a hotplate curry, they are loud, exciting, and impossible to ignore. They love attention and always turn ordinary moments into performances.",
		description: "Energetic, dramatic, and passionate — you bring heat wherever you go. You thrive in the spotlight and have the kind of presence people can't look away from. Your intensity is magnetic, and life is never boring when you're in the room."
	},
	{
		id: P.teppa,
		image: "images/Teppa_Spark.jpg",
		name: "🍳 Teppa Spark",
		title: "The Precision Show Chef",
		background: "Teppa Spark is cool, sharp, and precise. Like teppanyaki cooking, everything they do feels like a performance of skill and control. They may seem calm, but their presence always leaves a lasting impression.",
		description: "Focused, skillful, and stylish — you do everything with intention and flair. You're the kind of person who makes hard things look effortless. Detail-oriented and quietly confident, your precision and cool-headedness make you someone people deeply respect."
	}
];
// Expose for the 'Check out other personalities' modal
window.CHARACTERS = personalities;
window.showResult = function(p) {
	updateQuizLogoProgress(questions.length);
	resultName.textContent        = p.name;
	resultBackground.textContent  = p.title + ' — ' + p.background;
	resultDescription.textContent = p.description;
	const img = document.getElementById('result-illustration-img');
	if (img) { img.src = p.image; img.alt = p.name; }
	showScreen('result');
};

/* ---------------- UI ELEMENTS ---------------- */
const introScreen    = document.getElementById("intro-screen");
const quizScreen      = document.getElementById("quiz-screen");
const resultScreen    = document.getElementById("result-screen");
const arTeaserScreen  = document.getElementById("ar-teaser-screen");

const startButton          = document.getElementById("start-button");
const backButton           = document.getElementById("back-button");
const homeButton           = document.getElementById("home-button");
const arEdgeTabIntro       = document.getElementById("ar-edge-tab-intro");
const arEdgeTabResult      = document.getElementById("ar-edge-tab-result");
const launchArButton       = document.getElementById("launch-ar-button");
const arTeaserBackButton   = document.getElementById("ar-teaser-back-button");
const quizLogoFillWrapper  = document.getElementById("quiz-logo-fill-wrapper");
const questionPrompt       = document.getElementById("question-prompt");
const optionList           = document.getElementById("option-list");
const resultName           = document.getElementById("result-name");
const resultBackground     = document.getElementById("result-background");
const resultDescription    = document.getElementById("result-description");

/* ---------------- STATE ---------------- */
let currentQuestion = 0;
const answers = Array(questions.length).fill(null);

// Remembers which screen to return to when leaving the AR teaser
// (via swipe-back or the "Back" link), so it works from either intro or result.
let screenBeforeArTeaser = "intro";

/* ---------------- HELPERS ---------------- */
const SCREENS = {
	intro: introScreen,
	quiz: quizScreen,
	result: resultScreen,
	"ar-teaser": arTeaserScreen
};

function showScreen(name) {
	Object.values(SCREENS).forEach(el => {
		if (!el) return;
		el.style.display = "none";
		el.classList.add("hidden");
	});
	const active = SCREENS[name] || introScreen;
	active.style.display = "flex";
	active.classList.remove("hidden");
	window.scrollTo({ top: 0, behavior: "smooth" });

	// Show back button only on quiz screen, never on intro, result, or the AR teaser
	if (backButton) {
		backButton.style.display = name === "quiz" ? "inline-flex" : "none";
	}
}

function openArTeaser(fromScreen) {
	screenBeforeArTeaser = fromScreen;
	showScreen("ar-teaser");
}

function closeArTeaser() {
	showScreen(screenBeforeArTeaser);
}

function updateQuizLogoProgress(answeredCount) {
	if (!quizLogoFillWrapper) return;
	const pct = Math.max(0, Math.min(100, (answeredCount / questions.length) * 100));
	quizLogoFillWrapper.style.height = `${pct}%`;
	const noMask = pct >= 100 ? "none" : "";
	quizLogoFillWrapper.style.webkitMaskImage = noMask;
	quizLogoFillWrapper.style.maskImage = noMask;
}

function resetQuiz() {
	currentQuestion = 0;
	answers.fill(null);
	updateQuizLogoProgress(0);
}

/* ---------------- QUIZ ---------------- */
function renderQuestion() {
	const q = questions[currentQuestion];
	updateQuizLogoProgress(currentQuestion);
	questionPrompt.textContent = q.prompt;
	optionList.innerHTML = "";

	q.options.forEach((opt, i) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "option-button";
		btn.textContent = opt.text;
		btn.onclick = () => {
			// Visual feedback: add .selected (iOS-safe alternative to :active)
			optionList.querySelectorAll('.option-button').forEach(b => b.classList.remove('selected'));
			btn.classList.add('selected');
			answers[currentQuestion] = i;
			setTimeout(() => {
				if (currentQuestion < questions.length - 1) {
					currentQuestion++;
					renderQuestion();
				} else {
					renderResult();
				}
			}, 180); // brief delay so user sees selection before advancing
		};
		optionList.appendChild(btn);
	});
}

function getPersonality() {
	const tally = {};
	personalities.forEach(p => tally[p.id] = 0);
	answers.forEach((ansIdx, qIdx) => {
		if (ansIdx === null) return;
		Object.entries(questions[qIdx].options[ansIdx].scores).forEach(([id, pts]) => {
			if (tally[id] !== undefined) tally[id] += pts;
		});
	});
	return personalities.reduce((best, p) => tally[p.id] > tally[best.id] ? p : best, personalities[0]);
}

function renderResult() {
	const p = getPersonality();
	updateQuizLogoProgress(questions.length);
	resultName.textContent        = p.name;
	resultBackground.textContent  = p.title + " — " + p.background;
	resultDescription.textContent = p.description;
	const img = document.getElementById("result-illustration-img");
	if (img) { img.src = p.image; img.alt = p.name; }
	showScreen("result");
}

/* ---------------- EVENTS ---------------- */
startButton.onclick = () => { resetQuiz(); showScreen("quiz"); renderQuestion(); };

backButton.onclick = () => {
	if (currentQuestion === 0) {
		resetQuiz();
		showScreen("intro");
	} else {
		currentQuestion--;
		renderQuestion();
	}
};

homeButton.onclick = () => {
	resetQuiz();
	resetFeedback();
	showScreen("intro");
};

showScreen("intro");

/* ---------------- AR TEASER ---------------- */
// Desktop entry points: edge tab buttons on the intro and result screens
if (arEdgeTabIntro)  arEdgeTabIntro.onclick  = () => openArTeaser("intro");
if (arEdgeTabResult) arEdgeTabResult.onclick = () => openArTeaser("result");

// From the teaser screen: launch the standalone AR camera experience
if (launchArButton) {
	launchArButton.onclick = () => {
		window.location.href = "ar.html";
	};
}

// Explicit back link (in addition to swipe-back on mobile)
if (arTeaserBackButton) {
	arTeaserBackButton.onclick = () => closeArTeaser();
}

/* ---------------- MOBILE SWIPE NAVIGATION ---------------- */
// Swipe left on the intro/result screens opens the AR teaser.
// Swipe right on the AR teaser screen returns to whichever screen opened it.
// Swipe is intentionally NOT active on the quiz screen, so it never
// conflicts with tapping answer options.
(function setupSwipeNav() {
	const stageEl = document.querySelector(".stage");
	if (!stageEl) return;

	const SWIPE_THRESHOLD = 60;   // minimum horizontal px to count as a swipe
	const MAX_VERTICAL_DRIFT = 60; // ignore mostly-vertical gestures (scrolling)

	let touchStartX = 0;
	let touchStartY = 0;

	stageEl.addEventListener("touchstart", (e) => {
		if (!e.touches || e.touches.length === 0) return;
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
	}, { passive: true });

	stageEl.addEventListener("touchend", (e) => {
		if (!e.changedTouches || e.changedTouches.length === 0) return;
		const touchEndX = e.changedTouches[0].clientX;
		const touchEndY = e.changedTouches[0].clientY;
		const deltaX = touchEndX - touchStartX;
		const deltaY = touchEndY - touchStartY;

		if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaY) > MAX_VERTICAL_DRIFT) return;

		const introVisible  = introScreen && !introScreen.classList.contains("hidden");
		const resultVisible = resultScreen && !resultScreen.classList.contains("hidden");
		const teaserVisible = arTeaserScreen && !arTeaserScreen.classList.contains("hidden");

		if (deltaX < 0 && (introVisible || resultVisible)) {
			// Swiped left from intro or result -> open AR teaser
			openArTeaser(introVisible ? "intro" : "result");
		} else if (deltaX > 0 && teaserVisible) {
			// Swiped right from AR teaser -> go back
			closeArTeaser();
		}
	}, { passive: true });
})();

/* ---------------- FEEDBACK ---------------- */
let selectedRating = 0;

const stars           = document.querySelectorAll(".star");
const submitBtn       = document.getElementById("submit-feedback");
const feedbackMessage = document.getElementById("feedback-message");

function resetFeedback() {
	selectedRating = 0;
	stars.forEach(s => s.classList.remove("active"));
	document.getElementById("feedback-comment").value = "";
	feedbackMessage.textContent = "";
}

stars.forEach(star => {
	star.onclick = () => {
		selectedRating = Number(star.dataset.rating);
		stars.forEach(s => s.classList.toggle("active", Number(s.dataset.rating) <= selectedRating));
	};
});

submitBtn.onclick = async () => {
	const comment = document.getElementById("feedback-comment").value.trim();
	if (selectedRating === 0) { feedbackMessage.textContent = "Please select a star rating."; return; }

	submitBtn.disabled = true;
	submitBtn.textContent = "Sending…";

	try {
		await addDoc(collection(db, "feedback"), {
			rating: selectedRating,
			comment,
			createdAt: new Date()
		});
		feedbackMessage.textContent = "Thanks for your feedback!";
		document.getElementById("feedback-comment").value = "";
		stars.forEach(s => s.classList.remove("active"));
		selectedRating = 0;
	} catch (err) {
		console.error(err);
		feedbackMessage.textContent = "Error sending feedback. Please try again.";
	} finally {
		submitBtn.disabled = false;
		submitBtn.textContent = "Submit Feedback";
	}
};