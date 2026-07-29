---
title: "Why Medics Should Learn to Code and How to Do It"
summary: "Why medics who enjoy building should learn software engineering to turn clinical problems into scalable healthcare solutions."
date: 2026-07-26
draft: false
authors: ['Vidun Wedagedera']
show_breadcrumb: true
help_topic: 'medical-school'
weight: 10
build:
  publishResources: false
---

At the beginning of fourth year, I started learning how to code (very briefly).

Medical school was not exactly leaving me short of things to do. But my interest in medtech, particularly atrial fibrillation ablation (we had to choose a project to research during a specific block in the year, and my choice was AF), conversations with other students and the problems I kept noticing in general practice were all pushing me towards the same conclusion: I did not only want to understand healthcare. I wanted the ability to build within it.

I am now around halfway through CS50 and CS50 AI. I have built this website from scratch, although I have not yet built a full application or serious software product. Separate articles on both courses will come once I have finished them. For now, I am writing from the middle of the process rather than pretending I have reached the end.

My argument is not that every doctor needs to become a professional software engineer. Every medic should have a basic level of technical literacy: enough to understand code, write small programmes and analyse data. Medics who genuinely enjoy building should go much further.

Healthcare is becoming increasingly dependent on software. The people who understand its problems most closely should have more than the ability to point at those problems and hope somebody else builds the solution.

## Knowing how to build changes what you notice

Medical students are exposed to potential healthtech problems constantly.

We see information copied between systems, decisions delayed by missing data, repetitive work performed manually and processes that survive mainly because everyone has become used to them. I do not want to describe the specific problems I have noticed in general practice, but the broader pattern is difficult to miss. Healthcare contains a remarkable amount of intelligent human labour being spent on tasks that do not always require intelligent human labour.

The obvious response is to tell a software engineer.

That can work. Excellent healthcare technology is almost always multidisciplinary. But there is a difference between being able to describe a frustration and being able to translate it into a technical problem, investigate whether it is actually solvable and build an early version of the solution.

Paul Graham, the co-founder of Y Combinator, argues that the best startup ideas usually emerge from problems founders have experienced themselves. They are not manufactured by sitting in a room and attempting to think of something that sounds sufficiently disruptive. They are noticed by people whose experience has prepared them to recognise that something is missing. His version is: “Live in the future, then build what’s missing.”

## Medicine gives people one half of that preparation. Software engineering gives them the other.

Clinical training teaches you how healthcare actually behaves rather than how a process diagram says it behaves. You see which information matters, where uncertainty enters and why a minor inconvenience can become clinically important. Learning software then changes the questions you ask about those observations.

A clumsy workflow stops looking like an unavoidable feature of medicine and starts looking like a sequence of inputs, decisions and outputs. Repetitive documentation becomes a problem of structured data and system integration. A delay may turn out to be an information problem rather than a medical one.

You begin to see more things as buildable.

Graham makes a similar point about combining programming with another domain: once you understand both, you are more likely to notice problems that software could solve. Knowing how to build also shortens the distance between an idea and an experiment. Instead of saying, “Someone should make this”, you may be able to produce a crude first version and discover whether anybody actually needs it.

The first version will probably be unimpressive. This is useful. It is much cheaper to discover that an idea is bad when it is an ugly prototype than after a large team has built a beautiful product that nobody wants.

## The clinician-founder advantage

I think some of the best healthcare founders will be people who have lived inside healthcare.

This is not because doctors understand the whole system. We do not. A clinician may understand a consultation or procedural pathway deeply while knowing very little about procurement, regulation, cybersecurity, hospital finance or the practical difficulty of maintaining software across hundreds of organisations.

The advantage is narrower, but still important: clinicians possess situated knowledge.

They know what a decision feels like when the evidence is incomplete. They know which interruptions are merely irritating and which create risk. They understand that a tool can perform brilliantly in a paper yet fail because it arrives at the wrong point in the workflow, asks for information nobody has or produces an answer that does not change what happens next.

That knowledge is difficult to acquire from market research alone.

The strongest clinician-founders will not be doctors who assume that medical knowledge makes them naturally good at everything else. They will be people who combine clinical experience with enough technical depth to work properly alongside software engineers, designers, researchers, patients and operators.

The aim is not to eliminate the engineer from healthcare. It is to eliminate the situation in which the clinician arrives with a PowerPoint, the engineer arrives with an architecture diagram, and both leave believing the other person understood them.

A medic who can code can participate differently. They can judge what is technically trivial and what is genuinely difficult. They can interrogate assumptions, inspect data and prototype an idea before asking a team to spend months on it. They can also recognise when the sensible decision is to stop building.

That last skill may be the most commercially valuable one.

## Where My Interests Are

My interest in this began partly through medtech in atrial fibrillation ablation. Cardiac electrophysiology is a useful example because it produces large amounts of complex physiological data, while clinical decisions still depend on anatomy, procedural context and individual patient factors.

Artificial intelligence research in electrophysiology already includes AF detection, prediction of outcomes and potential support inside the electrophysiology laboratory. A 2025 scientific statement from the European Heart Rhythm Association, the Heart Rhythm Society and the ESC Working Group on E-Cardiology reviewed work across AF management, sudden cardiac death and electrophysiology procedures.

It also identified substantial gaps.

The statement introduced a 29-item checklist because studies were not consistently reporting important details about their datasets, participant populations, validation methods, performance and reproducibility. In other words, impressive model performance does not automatically tell us whether a system will improve care for real patients.

This is precisely why healthcare technology needs people who understand both the clinical problem and the technical method.

A software engineer may build an excellent model without fully understanding whether its output changes a meaningful decision. A clinician may recognise an important decision but underestimate bias, data quality or the difference between an algorithm working retrospectively and a product working safely in practice.

## The future may be agentic but medicine must remain human.

I think the next major shift will be towards more agentic software: systems that do not simply generate a single answer, but can plan and carry out a sequence of linked tasks.

In healthcare, that could eventually mean software gathering relevant information, coordinating parts of a workflow, drafting documentation, tracking results and prompting the next action. The potential is enormous because so much clinical time is currently lost between the important parts of care.

But the question is not simply whether a task can be automated. It is whether it should be, under what conditions and with whom remaining accountable.

The closer software moves towards clinical decisions, the more dangerous it becomes to treat medicine as a tidy optimisation problem. Patients do not arrive as complete datasets. They may value outcomes differently. They may need an explanation, reassurance or the sense that another human being has taken responsibility for what happens next.

## Technology cannot replicate the full empathy and human nature of medicine. Nor should that be its goal.

The 2019 Topol Review described one of the main opportunities of healthcare technology as the “gift of time”: automation should reduce avoidable work so that clinicians have more time for trust, presence, empathy and communication. It also warned that new technologies require clinical validation and should not dehumanise care.

That is the standard worth using. Good healthcare software should not make the patient–clinician relationship more efficient in the sense of making it smaller. It should remove the work that prevents the relationship from existing properly.

The World Health Organization similarly argues that AI for health must place ethics and human rights at the centre of its design and use, with clear human responsibility and routes for accountability when systems cause harm.

## Not every medic needs another degree...

The strongest objection is obvious: medical education is already overloaded.

Students are expected to learn an enormous body of science, develop clinical skills, complete placements, prepare for examinations and somehow remain functional human beings. Adding “become a software engineer” to the compulsory list would be unrealistic and probably produce a generation capable of writing mediocre Python while forgetting the causes of hyponatraemia.

That is not what I am proposing.

Basic technical literacy should become normal. A medic should be able to understand what code does, write small programmes, work with data and have a sensible conversation about how software systems are built. These skills matter even for doctors who never create a company. They will increasingly need to evaluate digital tools, understand their limitations and work safely in systems shaped by algorithms.

NHS workforce reviews have already argued that healthcare professionals need broader digital capabilities and that technology requires an appropriately trained workforce if it is to benefit patients.

Going further should be a choice.

For those who do enjoy it, courses such as CS50 provide a strong starting point. The immediate goal does not need to be founding a company. It can be writing a small programme, analysing a dataset or building something useful for yourself and your friends.

In my opinion, the most important step is to begin acquiring agency.

## Concluding thoughts

Medical training teaches us to recognise disease, uncertainty and failures in care. Software engineering can give some medics the ability to turn those observations into something tangible, testable and potentially scalable. In summary, I think the future of healthcare should not be built by doctors alone, but more of it should be built by doctors who know how to build.

As always, any questions, please do get in touch!