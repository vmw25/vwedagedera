---
title: ''
summary: 'Cambridge medical student exploring cardiovascular medicine, cardiac electrophysiology, research and health technology.'
type: landing

sections:
  - block: personal-hero
    id: hero
    content:
      eyebrow: 'Medical student · University of Cambridge'
      name: 'Vidun Wedagedera'
      headline: 'Building at the intersection of medicine, research and technology.'
      text: 'I am a Cambridge medical student exploring how research, technology and entrepreneurship can improve cardiovascular care. My current focus is cardiac electrophysiology, clinical problem discovery and the development of useful healthtech products.'
      focus: 'Currently exploring cardiac electrophysiology, clinically useful technology and better decisions in cardiovascular care.'
      primary_button:
        text: 'View selected work'
        url: '#work'
      secondary_button:
        text: 'Get in touch'
        url: '#contact'
      # TODO: Keep only confirmed public links here.
      social:
        text: 'View GitHub'
        url: 'https://github.com/vmw25'
    design:
      background:
        color: '#07090C'
      spacing:
        padding: ['7rem', '0', '5rem', '0']

  - block: portfolio
    id: work
    content:
      title: 'Selected Work'
      subtitle: 'Research, products and initiatives focused on improving healthcare.'
      count: 4
      sort_by: Weight
      sort_ascending: true
      filters:
        folders:
          - projects
      buttons:
        - name: All
          tag: '*'
    design:
      columns: 2
      animations: false
      fallback_icon: heart
      status_badge:
        enable: true
      background:
        color: '#0B0F13'
      spacing:
        padding: ['5rem', '0', '5rem', '0']

  - block: markdown
    id: about
    content:
      title: 'About'
      text: |-
        I am a medical student at the University of Cambridge with a growing focus on cardiovascular medicine, health technology and clinical innovation.

        I am particularly interested in cardiac electrophysiology and in the difficult decisions, fragmented workflows and unresolved problems surrounding atrial fibrillation and catheter ablation.

        Alongside medicine, I am developing skills in research, data analysis, programming and product development. My aim is to understand important clinical problems deeply and build technology that is useful in real clinical practice.
    design:
      background:
        color: '#07090C'
      spacing:
        padding: ['5rem', '0', '2rem', '0']

  - block: focus-areas
    id: current-focus
    content:
      title: 'Current focus'
      text: 'I am currently studying unresolved problems in electrophysiology, learning from clinicians and developing the technical and product skills needed to test potential solutions.'
      items:
        - name: 'Clinical problem discovery'
          description: 'Understanding where cardiovascular workflows create uncertainty, delay or unnecessary variation.'
        - name: 'Research and evidence'
          description: 'Using literature, data and clinical insight to distinguish important problems from superficially attractive ideas.'
        - name: 'Building and testing'
          description: 'Turning strong problem hypotheses into simple prototypes that can be evaluated with real users.'
    design:
      layout: cards
      background:
        color: '#07090C'
      spacing:
        padding: ['2rem', '0', '5rem', '0']

  - block: personal-skills
    id: skills
    content:
      title: 'Skills and Tools'
      subtitle: 'A developing toolkit spanning medicine, research, data and product development.'
      groups:
        - name: 'Medicine and research'
          items: ['Clinical medicine', 'Cardiovascular medicine', 'Cardiac electrophysiology', 'Literature review', 'Evidence appraisal', 'Scientific writing', 'Research design']
        - name: 'Data and modelling'
          note: 'Applied in research'
          items: ['R', 'Data cleaning', 'Data visualisation', 'Pharmacokinetic analysis', 'Scientific modelling', 'Quantitative interpretation']
        - name: 'Technology'
          note: 'Developing'
          items: ['C', 'Git', 'GitHub', 'Markdown', 'Hugo', 'HugoBlox', 'GitHub Pages']
        - name: 'Product and leadership'
          items: ['Clinical problem discovery', 'User research', 'Product thinking', 'Healthtech strategy', 'Event organisation', 'Community building', 'Entrepreneurship', 'Teaching', 'Communication']
    design:
      background:
        color: '#0B0F13'
      spacing:
        padding: ['5rem', '0', '5rem', '0']

  - block: personal-experience
    id: experience
    content:
      title: 'Experience'
      subtitle: 'Medicine, research, leadership and entrepreneurship.'
      items:
        # TODO: Add the verified start date for medical training.
        - role: 'Medical Student'
          organisation: 'University of Cambridge'
          current: true
          description: 'Clinical and academic training across medicine, biomedical science and research, with a growing focus on cardiovascular medicine and medical technology.'
        # TODO: Add verified MedTech Society dates.
        - role: 'Vice President'
          organisation: 'Cambridge University MedTech Society'
          description: 'Supporting events, workshops, networking opportunities and new initiatives connecting students with professionals working across medical technology, research and entrepreneurship.'
        # TODO: Add verified research placement dates and public organisation names where appropriate.
        - role: 'Research Experience'
          organisation: 'Biomedical and Clinical Research'
          description: 'Experience working with biomedical research, scientific literature, quantitative analysis and modelling across academic and applied research settings.'
        # TODO: Add verified venture dates and its public name if desired.
        - role: 'Founder and Tutor'
          organisation: 'Education Venture'
          description: 'Built and ran an education-focused venture supporting students with academic development and competitive university applications.'
    design:
      background:
        color: '#07090C'
      spacing:
        padding: ['5rem', '0', '5rem', '0']

  - block: markdown
    id: writing
    content:
      title: 'Writing'
      text: |-
        **Notes on cardiovascular medicine, clinical problems, research and building health technology.**

        Writing is in progress. Drafts stay private until they are ready to publish.
    design:
      background:
        color: '#0B0F13'
      spacing:
        padding: ['5rem', '0', '5rem', '0']

  - block: contact-info
    id: contact
    content:
      username: me
      title: 'Let’s connect'
      subtitle: 'I am always interested in speaking with clinicians, researchers, founders and students working on cardiovascular medicine, cardiac electrophysiology and health technology.'
      connect_title: 'Find me online'
      text: 'GitHub is the only public contact link configured at the moment. Email, LinkedIn and CV links will appear only after they have been supplied.'
      # TODO: Add email, LinkedIn and CV actions only after Vidun supplies them.
      social:
        - icon: brands/github
          url: 'https://github.com/vmw25'
          label: 'View GitHub'
      show_form: false
    design:
      background:
        color: '#07090C'
      spacing:
        padding: ['5rem', '0', '6rem', '0']
---
