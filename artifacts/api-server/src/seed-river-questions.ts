// Run: npx tsx src/seed-river-questions.ts
import { db, lessonQuestionsTable, lessonsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const easyQuestions: Array<{
  lessonId: number;
  question: string;
  type: "multiple_choice" | "true_false";
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
}> = [
  // ── Lesson 1: What is a Stock? (id=1) ──────────────────────────────────
  {
    lessonId: 1,
    question: "If you buy one share of a company's stock, what does that make you?",
    type: "multiple_choice",
    options: ["A lender", "A part-owner", "A manager", "A customer"],
    correctAnswer: "A part-owner",
    explanation: "Owning stock means owning a small piece of the company — you're a part-owner!",
  },
  {
    lessonId: 1,
    question: "Stock prices can go down as well as up.",
    type: "true_false",
    options: null,
    correctAnswer: "True",
    explanation: "Stock prices move both ways — they can rise when a company does well and fall when it struggles.",
  },
  {
    lessonId: 1,
    question: "What is another word for a stock?",
    type: "multiple_choice",
    options: ["Bond", "Share", "Loan", "Coin"],
    correctAnswer: "Share",
    explanation: "Stocks and shares mean the same thing — a slice of ownership in a company.",
  },
  {
    lessonId: 1,
    question: "All stocks pay dividends to their owners.",
    type: "true_false",
    options: null,
    correctAnswer: "False",
    explanation: "Not all stocks pay dividends. Some companies reinvest all their profits instead of paying shareholders.",
  },
  {
    lessonId: 1,
    question: "Which of these is a real company whose stock you can buy?",
    type: "multiple_choice",
    options: ["SpikeCo", "Apple", "Fictonia", "Moneyville"],
    correctAnswer: "Apple",
    explanation: "Apple (AAPL) is a publicly traded company — you can buy its stock on the stock market.",
  },
  {
    lessonId: 1,
    question: "If Apple earns more money than expected, its stock price will usually…",
    type: "multiple_choice",
    options: ["Go down", "Stay exactly the same", "Go up", "Disappear"],
    correctAnswer: "Go up",
    explanation: "Good news for a company typically pushes its stock price higher because investors get excited.",
  },

  // ── Lesson 2: How the Stock Market Works (id=2) ─────────────────────────
  {
    lessonId: 2,
    question: "The stock market is open 24 hours a day, 7 days a week.",
    type: "true_false",
    options: null,
    correctAnswer: "False",
    explanation: "Major stock markets like the NYSE are open on weekdays during business hours — not 24/7.",
  },
  {
    lessonId: 2,
    question: "What does NYSE stand for?",
    type: "multiple_choice",
    options: ["New York Stock Exchange", "National Yellow Stock Exchange", "North York Share Exchange", "New York Savings Exchange"],
    correctAnswer: "New York Stock Exchange",
    explanation: "NYSE is one of the world's largest stock exchanges, located in New York City.",
  },
  {
    lessonId: 2,
    question: "Who sets the price of a stock?",
    type: "multiple_choice",
    options: ["The government", "The company's CEO", "Buyers and sellers in the market", "A single banker"],
    correctAnswer: "Buyers and sellers in the market",
    explanation: "Stock prices are decided by supply and demand — what buyers are willing to pay and sellers will accept.",
  },
  {
    lessonId: 2,
    question: "A stockbroker helps people buy and sell stocks.",
    type: "true_false",
    options: null,
    correctAnswer: "True",
    explanation: "Brokers act as the middleman between you and the stock exchange.",
  },
  {
    lessonId: 2,
    question: "What happens if more people want to sell a stock than buy it?",
    type: "multiple_choice",
    options: ["The price goes up", "The price goes down", "The price stays the same", "The company closes"],
    correctAnswer: "The price goes down",
    explanation: "When there are more sellers than buyers, the price drops because sellers must lower it to find buyers.",
  },
  {
    lessonId: 2,
    question: "The NASDAQ is famous for listing many technology companies.",
    type: "true_false",
    options: null,
    correctAnswer: "True",
    explanation: "NASDAQ is known as a tech-heavy exchange — companies like Apple, Google, and Microsoft trade there.",
  },

  // ── Lesson 3: Your First Stock Purchase (id=3) ──────────────────────────
  {
    lessonId: 3,
    question: "You buy a stock at $20 and sell it at $30. How much profit did you make per share?",
    type: "multiple_choice",
    options: ["$5", "$10", "$20", "$30"],
    correctAnswer: "$10",
    explanation: "$30 − $20 = $10 profit per share. Simple!",
  },
  {
    lessonId: 3,
    question: "You should invest all of your savings into one company's stock.",
    type: "true_false",
    options: null,
    correctAnswer: "False",
    explanation: "Putting all your money in one stock is very risky. Spreading it around (diversifying) is safer.",
  },
  {
    lessonId: 3,
    question: "What is a 'market order'?",
    type: "multiple_choice",
    options: ["An order to buy groceries", "A request to buy or sell at the current price", "A government rule about stocks", "A type of savings account"],
    correctAnswer: "A request to buy or sell at the current price",
    explanation: "A market order tells your broker: buy or sell this stock right now at whatever price it's trading at.",
  },
  {
    lessonId: 3,
    question: "Investing in stocks is always risk-free.",
    type: "true_false",
    options: null,
    correctAnswer: "False",
    explanation: "All investments carry some risk. Stock prices can fall and you could lose money.",
  },
  {
    lessonId: 3,
    question: "What does 'buy low, sell high' mean?",
    type: "multiple_choice",
    options: ["Buy cheap food and sell expensive food", "Buy stocks when prices are low, sell when prices are high", "Buy lots of stocks at once", "Sell stocks whenever you want"],
    correctAnswer: "Buy stocks when prices are low, sell when prices are high",
    explanation: "The goal is to make a profit — buy cheap, sell at a higher price.",
  },

  // ── Lesson 4: What is an ETF? (id=4) ───────────────────────────────────
  {
    lessonId: 4,
    question: "ETF stands for…",
    type: "multiple_choice",
    options: ["Extra Trading Fund", "Exchange-Traded Fund", "Electronic Transfer Fund", "Equity Transfer Form"],
    correctAnswer: "Exchange-Traded Fund",
    explanation: "ETF = Exchange-Traded Fund. It's a basket of stocks you can buy like a single stock.",
  },
  {
    lessonId: 4,
    question: "An ETF can hold hundreds of different stocks at once.",
    type: "true_false",
    options: null,
    correctAnswer: "True",
    explanation: "ETFs bundle many stocks together, giving you instant diversification in one purchase.",
  },
  {
    lessonId: 4,
    question: "If you buy an S&P 500 ETF, you are investing in…",
    type: "multiple_choice",
    options: ["One giant company", "The 500 largest US companies", "Only technology stocks", "Government bonds"],
    correctAnswer: "The 500 largest US companies",
    explanation: "The S&P 500 tracks America's 500 biggest public companies — one ETF gives you a piece of all of them.",
  },
  {
    lessonId: 4,
    question: "ETFs can only be bought or sold at the end of the trading day.",
    type: "true_false",
    options: null,
    correctAnswer: "False",
    explanation: "Unlike mutual funds, ETFs trade throughout the day like regular stocks.",
  },
  {
    lessonId: 4,
    question: "Why might a beginner investor choose an ETF over a single stock?",
    type: "multiple_choice",
    options: ["ETFs are free to buy", "ETFs spread risk across many companies", "ETFs always go up in price", "ETFs pay higher dividends"],
    correctAnswer: "ETFs spread risk across many companies",
    explanation: "Owning one company is risky — if it fails, you lose everything. ETFs spread that risk.",
  },
  {
    lessonId: 4,
    question: "What word describes owning many different investments to reduce risk?",
    type: "multiple_choice",
    options: ["Concentration", "Diversification", "Speculation", "Liquidation"],
    correctAnswer: "Diversification",
    explanation: "Diversification means not putting all your eggs in one basket — spreading investments to lower risk.",
  },

  // ── Lesson 5: What is a Mutual Fund? (id=5) ─────────────────────────────
  {
    lessonId: 5,
    question: "A mutual fund pools money from many investors to buy a variety of stocks.",
    type: "true_false",
    options: null,
    correctAnswer: "True",
    explanation: "Mutual funds collect money from lots of people and a professional manager invests it together.",
  },
  {
    lessonId: 5,
    question: "Who manages the investments inside a mutual fund?",
    type: "multiple_choice",
    options: ["The investors themselves", "A professional fund manager", "The government", "A robot"],
    correctAnswer: "A professional fund manager",
    explanation: "A fund manager decides which stocks to buy and sell inside a mutual fund.",
  },
  {
    lessonId: 5,
    question: "Mutual funds can only be bought at the end of the trading day.",
    type: "true_false",
    options: null,
    correctAnswer: "True",
    explanation: "Mutual fund prices are set once a day after the market closes — unlike ETFs which trade all day.",
  },
  {
    lessonId: 5,
    question: "What do you call the fee a mutual fund charges you for managing your money?",
    type: "multiple_choice",
    options: ["A tax", "An expense ratio", "A dividend", "A commission bonus"],
    correctAnswer: "An expense ratio",
    explanation: "The expense ratio is the annual fee (as a percentage) you pay the fund to manage your investment.",
  },
  {
    lessonId: 5,
    question: "A mutual fund that tracks the S&P 500 without a manager making decisions is called…",
    type: "multiple_choice",
    options: ["An active fund", "A growth fund", "An index fund", "A hedge fund"],
    correctAnswer: "An index fund",
    explanation: "Index funds copy a market index automatically — no manager needed, so fees are usually very low.",
  },

  // ── Lesson 6: ETF vs Mutual Fund (id=6) ────────────────────────────────
  {
    lessonId: 6,
    question: "ETFs can be traded any time during market hours, while mutual funds cannot.",
    type: "true_false",
    options: null,
    correctAnswer: "True",
    explanation: "This is one of the key differences — ETFs are flexible and trade like stocks, mutual funds settle once a day.",
  },
  {
    lessonId: 6,
    question: "Which typically has lower annual fees?",
    type: "multiple_choice",
    options: ["Actively managed mutual funds", "Index ETFs", "Hedge funds", "They all cost the same"],
    correctAnswer: "Index ETFs",
    explanation: "Index ETFs often have very low expense ratios because no manager is actively picking stocks.",
  },
  {
    lessonId: 6,
    question: "Both ETFs and mutual funds help you diversify your investments.",
    type: "true_false",
    options: null,
    correctAnswer: "True",
    explanation: "Both spread your money across many stocks — that's the big advantage of both types.",
  },
  {
    lessonId: 6,
    question: "An actively managed fund tries to…",
    type: "multiple_choice",
    options: ["Match the market exactly", "Beat the market returns", "Lose as little money as possible", "Never buy or sell stocks"],
    correctAnswer: "Beat the market returns",
    explanation: "Active fund managers try to pick winning stocks to earn more than the overall market average.",
  },
  {
    lessonId: 6,
    question: "Most actively managed funds outperform the S&P 500 over 20 years.",
    type: "true_false",
    options: null,
    correctAnswer: "False",
    explanation: "Research shows most active funds underperform index funds over the long run after fees.",
  },

  // ── Lesson 7: Bull & Bear Markets (id=7) ────────────────────────────────
  {
    lessonId: 7,
    question: "A bull market means stock prices are generally rising.",
    type: "true_false",
    options: null,
    correctAnswer: "True",
    explanation: "Bulls charge forward and upward — a bull market is an optimistic, rising market.",
  },
  {
    lessonId: 7,
    question: "A bear market officially begins when stocks fall by at least…",
    type: "multiple_choice",
    options: ["5%", "10%", "20%", "50%"],
    correctAnswer: "20%",
    explanation: "A bear market is defined as a drop of 20% or more from a recent high.",
  },
  {
    lessonId: 7,
    question: "What should a long-term investor usually do during a bear market?",
    type: "multiple_choice",
    options: ["Panic and sell everything", "Stay calm and keep investing", "Borrow money to buy more", "Stop thinking about it forever"],
    correctAnswer: "Stay calm and keep investing",
    explanation: "Bear markets are temporary. Staying invested — or even buying more at lower prices — usually pays off.",
  },
  {
    lessonId: 7,
    question: "Bear markets last forever and stocks never recover.",
    type: "true_false",
    options: null,
    correctAnswer: "False",
    explanation: "History shows that bear markets always end and stocks eventually reach new highs.",
  },
  {
    lessonId: 7,
    question: "When the economy is growing and unemployment is low, you'd usually expect a…",
    type: "multiple_choice",
    options: ["Bear market", "Bull market", "Frozen market", "Sleeping market"],
    correctAnswer: "Bull market",
    explanation: "Strong economies tend to push stock prices up — that's a bull market environment.",
  },
  {
    lessonId: 7,
    question: "The mascot of Market Spike is a bull named Spike. Bulls represent optimism in investing.",
    type: "true_false",
    options: null,
    correctAnswer: "True",
    explanation: "Spike the bull represents the can-do spirit of the market — always charging forward!",
  },

  // ── Lesson 8: What is a Portfolio? (id=8) ───────────────────────────────
  {
    lessonId: 8,
    question: "Your investment portfolio is…",
    type: "multiple_choice",
    options: ["A fancy briefcase", "The collection of all your investments", "Your bank account balance", "A type of bond"],
    correctAnswer: "The collection of all your investments",
    explanation: "A portfolio is everything you own as investments — stocks, ETFs, bonds, etc.",
  },
  {
    lessonId: 8,
    question: "It's smart to hold both stocks and bonds in a portfolio.",
    type: "true_false",
    options: null,
    correctAnswer: "True",
    explanation: "Mixing asset types (like stocks and bonds) helps balance risk — when one goes down, the other may hold steady.",
  },
  {
    lessonId: 8,
    question: "If your portfolio is 'up 10%', it means…",
    type: "multiple_choice",
    options: ["You lost 10%", "You gained 10%", "You owe 10%", "Your broker took 10%"],
    correctAnswer: "You gained 10%",
    explanation: "A portfolio up 10% means your investments grew by 10% of what you put in — nice!",
  },
  {
    lessonId: 8,
    question: "A younger investor can usually afford to take more risk in their portfolio.",
    type: "true_false",
    options: null,
    correctAnswer: "True",
    explanation: "Young investors have more time to recover from market dips, so they can hold more stocks.",
  },
  {
    lessonId: 8,
    question: "Rebalancing a portfolio means…",
    type: "multiple_choice",
    options: ["Selling all your stocks", "Adjusting your investments back to your target mix", "Adding only bonds", "Never changing anything"],
    correctAnswer: "Adjusting your investments back to your target mix",
    explanation: "Over time, some investments grow faster than others. Rebalancing restores your original plan.",
  },
  {
    lessonId: 8,
    question: "What does 'asset allocation' mean?",
    type: "multiple_choice",
    options: ["How many apps you use to invest", "How you split your money among different types of investments", "The total dollar value of your portfolio", "Picking only one investment"],
    correctAnswer: "How you split your money among different types of investments",
    explanation: "Asset allocation is deciding what percentage goes to stocks, bonds, cash, etc.",
  },

  // ── Lesson 9: What are Dividends? (id=9) ────────────────────────────────
  {
    lessonId: 9,
    question: "A dividend is money a company pays to its shareholders from its profits.",
    type: "true_false",
    options: null,
    correctAnswer: "True",
    explanation: "Dividends are like a thank-you payment from the company for owning its stock.",
  },
  {
    lessonId: 9,
    question: "How often are dividends most commonly paid?",
    type: "multiple_choice",
    options: ["Every day", "Every week", "Every quarter (3 months)", "Every decade"],
    correctAnswer: "Every quarter (3 months)",
    explanation: "Most dividend-paying companies pay out every quarter — four times per year.",
  },
  {
    lessonId: 9,
    question: "If a stock pays a $1 dividend and you own 50 shares, how much do you receive?",
    type: "multiple_choice",
    options: ["$1", "$10", "$50", "$500"],
    correctAnswer: "$50",
    explanation: "$1 × 50 shares = $50. The more shares you own, the bigger your dividend check!",
  },
  {
    lessonId: 9,
    question: "Companies are required by law to pay dividends.",
    type: "true_false",
    options: null,
    correctAnswer: "False",
    explanation: "Paying dividends is completely optional. Many growing companies reinvest profits instead.",
  },
  {
    lessonId: 9,
    question: "What is dividend reinvestment?",
    type: "multiple_choice",
    options: ["Spending your dividend on groceries", "Using your dividend payment to buy more shares", "Returning your dividend to the company", "Investing only in dividend stocks"],
    correctAnswer: "Using your dividend payment to buy more shares",
    explanation: "Reinvesting dividends means you automatically buy more stock — letting compounding work its magic.",
  },
];

async function seed() {
  console.log(`Seeding ${easyQuestions.length} easy river crossing questions…`);
  let inserted = 0;

  for (let i = 0; i < easyQuestions.length; i++) {
    const q = easyQuestions[i];
    await db.insert(lessonQuestionsTable).values({
      lessonId: q.lessonId,
      question: q.question,
      type: q.type,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      sortOrder: 100 + i, // place after existing questions
    });
    inserted++;
    if (inserted % 10 === 0) console.log(`  ${inserted}/${easyQuestions.length} done`);
  }

  console.log(`✅ Seeded ${inserted} easy questions across lessons 1–9.`);
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
