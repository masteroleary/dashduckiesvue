<script setup lang="ts">
useHead({
  title: 'Privacy Policy — DashDuckies',
  meta: [{ name: 'description', content: 'How DashDuckies collects, uses and shares your information.' }],
})
</script>

<template>
  <section class="terms-section">
    <div class="terms-container">
      <h1 class="terms-heading">Privacy Policy</h1>
      <p class="terms-updated">Last Updated: September 28, 2026</p>
      <div class="terms-content">
        <h2>1. Overview</h2>
        <p>This Privacy Policy explains what information DashDuckies ("we," "us," or "our") collects when you use our website and services (the "Service"), how we use it, and who we share it with. It forms part of our <NuxtLink to="/terms">Terms of Service</NuxtLink>. If you do not agree with this policy, please do not use the Service.</p>

        <h2>2. The short version</h2>
        <p>We collect an account contact detail so you can sign in, and the sightings you choose to post. <strong>We do not track your location.</strong> Location is recorded only at the moment you submit a duck sighting, and only the location attached to that sighting. The Service runs no background, continuous, or passive location tracking of any kind.</p>

        <h2>3. Information you give us</h2>
        <p><strong>Account information.</strong> To create an account we collect an email address or mobile phone number, which we use to send you a one-time sign-in code. You may also add your name, a profile picture, and a postal address if you order physical products.</p>
        <p><strong>Duck sightings.</strong> When you report a sighting, we collect the location you provide (as an address and as map coordinates), the date, any photo you upload, and any text you write. You may report a sighting without an account.</p>
        <p><strong>Forum posts and comments.</strong> If you post in the forum we collect the display name you give, the text of your post, and any image you attach.</p>
        <p><strong>Newsletter.</strong> If you subscribe, we store your email address for that purpose.</p>

        <h2>4. Location data</h2>
        <p>Location is collected <strong>only when you actively submit a duck sighting</strong>. We do not request, receive, or store your device's location at any other time, and the Service does not run in the background.</p>
        <p>The location you submit with a sighting is <strong>published</strong>, along with the duck and any photo you attached. It appears on that duck's own page, which anyone can open without an account — that is how a person who finds a duck reads its history. It also appears on the DashDuckies sightings map, which requires a free account to view. Please do not submit a location you would not want shown publicly — for example, your home address. You are welcome to give a nearby landmark, street, or town instead of an exact address.</p>

        <h2>5. Photos and hidden photo data</h2>
        <p>Photos taken on a phone often contain hidden GPS coordinates recorded by the camera. When you upload a sighting photo, we read those coordinates, if present, to help place the sighting on the map.</p>
        <p>We then re-encode every uploaded image before storing it, which <strong>removes the original hidden data, including GPS coordinates</strong>, from the copy we keep and publish. The photo shown on the site does not carry your camera's embedded location.</p>

        <h2>6. Information collected automatically</h2>
        <p>We record your IP address briefly in memory to limit how often submissions and sign-in codes can be requested from one place. This is used to prevent abuse and is not stored in our database or used to build a profile of you.</p>
        <p>When you sign in, we set a cookie containing a session token so you stay signed in. This cookie is necessary for the Service to function. We do not use advertising or third-party tracking cookies.</p>

        <h2>7. How we use your information</h2>
        <ul>
          <li>To create and maintain your account and sign you in</li>
          <li>To publish the duck sightings, photos and posts you choose to submit</li>
          <li>To notify you when one of your ducks is spotted</li>
          <li>To fulfil and deliver orders you place</li>
          <li>To respond to messages and problem reports you send us</li>
          <li>To protect the Service from spam, fraud and abuse</li>
        </ul>
        <p>We do not sell your personal information.</p>

        <h2>8. What is public</h2>
        <p><strong>Visible to anyone, with or without an account:</strong> a duck's page — its name, story, photo, and the sightings and locations reported for it. Duck pages are open on purpose, so that whoever finds a duck can scan its code and read its history.</p>
        <p><strong>Visible to anyone with a free account:</strong> the sightings map, the activity feed, and the community forum, including the display name attached to a sighting or forum post.</p>
        <p>Your email address, phone number and postal address are never displayed publicly.</p>

        <h2>9. Service providers we share with</h2>
        <p>We share limited information with the providers that operate parts of the Service on our behalf:</p>
        <ul>
          <li><strong>Twilio</strong> — to send sign-in codes by SMS (receives your phone number)</li>
          <li><strong>SendGrid</strong> — to send emails and sign-in codes (receives your email address)</li>
          <li><strong>HERE</strong> — to convert an address you type into map coordinates (receives the address text you submit)</li>
          <li><strong>Microsoft Azure</strong> — to store uploaded images</li>
          <li><strong>Railway</strong> — hosting and database services</li>
        </ul>
        <p>These providers may only use the information to perform their service for us. We may also disclose information where required by law, or to protect our rights, safety, or the safety of others.</p>

        <h2>10. Data retention</h2>
        <p>We keep account information for as long as your account is open. Sign-in codes expire after ten minutes. Sightings, photos and forum posts remain on the Service until removed by you or by us.</p>

        <h2>11. Your choices and rights</h2>
        <p>You can view and update your account details and your ducks while signed in. You may ask us to delete your account and associated personal information, or to correct or remove a sighting, photo or post, by contacting us at <a href="mailto:info@dashduckies.com">info@dashduckies.com</a>. Depending on where you live, you may have additional rights to access, correct, delete, or restrict the use of your personal information, and to complain to your local data protection authority.</p>
        <p>You can unsubscribe from marketing emails at any time using the link in the email.</p>

        <h2>12. Children</h2>
        <p>The Service is not directed at children under 13, and we do not knowingly collect personal information from them. If you believe a child under 13 has given us personal information, please contact us and we will delete it.</p>

        <h2>13. Changes to this policy</h2>
        <p>We may update this Privacy Policy from time to time. The "Last Updated" date above shows when it last changed. Continued use of the Service after a change means you accept the updated policy.</p>

        <h2>14. Contact us</h2>
        <p>Questions about this policy, or about your information, can be sent to <a href="mailto:info@dashduckies.com">info@dashduckies.com</a>.</p>
      </div>
    </div>
  </section>
</template>
