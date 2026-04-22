export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated: April 2026
      </p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-2">Overview</h2>
          <p>
            StoryNest Kids (&quot;the App&quot;) is a family storytelling platform
            designed for children aged 3-9, operated by StoryNest
            (&quot;we&quot;, &quot;us&quot;). We take the privacy of children
            seriously and comply with the Children&apos;s Online Privacy
            Protection Act (COPPA) and applicable privacy laws.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            Information We Collect
          </h2>
          <h3 className="font-medium mt-3 mb-1">From Parents</h3>
          <ul className="list-disc ml-5 space-y-1">
            <li>Account information (email, name) for parent accounts</li>
            <li>
              Voice recordings (optional, for personalized story narration)
            </li>
            <li>Photos (optional, for creating cartoon avatars)</li>
            <li>Uploaded text content for story generation</li>
          </ul>
          <h3 className="font-medium mt-3 mb-1">From Children</h3>
          <ul className="list-disc ml-5 space-y-1">
            <li>
              First name and age (provided by parent during profile setup)
            </li>
            <li>
              Story listening activity (which episodes were played, completion
              status) — stored anonymously and used only to show progress
            </li>
          </ul>
          <p className="mt-2">
            We do <strong>not</strong> collect children&apos;s email addresses,
            photos, precise location, or any contact information directly from
            children.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">How We Use Information</h2>
          <ul className="list-disc ml-5 space-y-1">
            <li>To generate personalized story episodes for your child</li>
            <li>To track listening progress so children can resume stories</li>
            <li>To improve the quality of story generation</li>
            <li>To send push notifications about new stories (with parent consent)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Data Sharing</h2>
          <p>
            We do <strong>not</strong> sell, rent, or share personal information
            with third parties for advertising or marketing purposes. We use
            third-party services (cloud hosting, AI processing) solely to
            operate the App. These services process data under our direction and
            are bound by confidentiality obligations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            Children&apos;s Privacy (COPPA)
          </h2>
          <ul className="list-disc ml-5 space-y-1">
            <li>
              All child profiles are created and managed by a parent or guardian
            </li>
            <li>
              The child-facing portion of the App does not contain ads, in-app
              purchases, social features, or external links
            </li>
            <li>
              Children cannot communicate with other users or share personal
              information
            </li>
            <li>
              Parents can review, modify, or delete their child&apos;s data at
              any time through the parent dashboard
            </li>
            <li>
              The parent section is protected by an access code to prevent
              unsupervised access by children
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Data Storage</h2>
          <p>
            Data is stored securely using industry-standard encryption on
            cloud servers. Uploaded voice recordings and images are stored in
            encrypted cloud storage. You can delete any uploaded content at any
            time from the parent dashboard.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Your Rights</h2>
          <p>
            Parents may at any time: review the personal information collected
            from their child; request deletion of their child&apos;s data;
            refuse further collection of their child&apos;s information. To
            exercise these rights, use the parent dashboard or contact us at
            the email below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Contact</h2>
          <p>
            For privacy-related questions or requests, contact us at:{" "}
            <strong>privacy@storynest.app</strong>
          </p>
        </section>
      </div>
    </div>
  );
}
